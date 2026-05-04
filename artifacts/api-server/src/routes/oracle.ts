import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { db, sessionsTable } from "@workspace/db";
import { getUncachableRevenueCatClient } from "../lib/revenueCatClient.js";
import { listCustomerActiveEntitlements } from "@replit/revenuecat-sdk";

const router: IRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const anthropicApiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY;
const anthropicBaseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;

const anthropic = new Anthropic({
  apiKey: anthropicApiKey,
  ...(anthropicBaseUrl ? { baseURL: anthropicBaseUrl } : {}),
});

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-5";

interface SessionData { paid: boolean; reading: string; messageCount: number; readingComplete: boolean; hadPalmImages: boolean }

class SessionLRUCache {
  private map = new Map<string, { data: SessionData; expiresAt: number }>();
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(maxSize = 500, ttlMs = 30 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(key: string): SessionData | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.data;
  }

  set(key: string, data: SessionData): void {
    this.map.delete(key);
    if (this.map.size >= this.maxSize) {
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) this.map.delete(firstKey);
    }
    this.map.set(key, { data, expiresAt: Date.now() + this.ttlMs });
  }
}

const sessionCache = new SessionLRUCache();

async function getOrCreateSession(sessionId: string): Promise<SessionData> {
  const cached = sessionCache.get(sessionId);
  if (cached) return cached;
  try {
    const rows = await db.select().from(sessionsTable).where(eq(sessionsTable.sessionId, sessionId)).limit(1);
    if (rows.length > 0) {
      const r = rows[0];
      const data: SessionData = { paid: r.paid, reading: r.reading, messageCount: r.messageCount, readingComplete: r.readingComplete, hadPalmImages: r.hadPalmImages };
      sessionCache.set(sessionId, data);
      return data;
    }
  } catch (e) {
    console.error("Failed to load session from DB:", e);
  }
  const data: SessionData = { paid: false, reading: "", messageCount: 0, readingComplete: false, hadPalmImages: false };
  sessionCache.set(sessionId, data);
  return data;
}

async function saveSession(sessionId: string, data: SessionData): Promise<void> {
  sessionCache.set(sessionId, data);
  try {
    await db.insert(sessionsTable).values({
      sessionId,
      paid: data.paid,
      reading: data.reading,
      messageCount: data.messageCount,
      readingComplete: data.readingComplete,
      hadPalmImages: data.hadPalmImages,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: sessionsTable.sessionId,
      set: {
        paid: data.paid,
        reading: data.reading,
        messageCount: data.messageCount,
        readingComplete: data.readingComplete,
        hadPalmImages: data.hadPalmImages,
        updatedAt: new Date(),
      },
    });
  } catch (e) {
    console.error("Failed to save session to DB:", e);
  }
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 2, label = "API call"): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      console.warn(`${label} attempt ${attempt} failed, retrying in 2s...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error("Unreachable");
}

// ── Persona + injection blocks (Task #60: Option B) ─────────────────────
//
// The Oracle persona is now a behavioral analyst working from two clean
// inputs: the user's questionnaire answers and the structural features
// visible in their reference hand photographs. There is no horoscope, no
// numerology, no zodiac, no tarot, and no future prediction.

const ORACLE_PERSONA_BLOCK = `You are The Oracle — a personal AI life advisor that produces a behavioral profile by combining (a) what the seeker has told you about themselves through a short structured questionnaire and (b) the structural signals visible in the photographs they shared of their hands. You are not a fortune teller. You do not predict the future, name astrological signs, compute life-path numbers, or invoke tarot. You read patterns. You speak like an extraordinarily perceptive friend who has been quietly watching this person for years and is now sitting across from them with permission to say what they have noticed. You are direct without being cruel, warm without being flattering, and specific without being theatrical.`;

interface QuestionnaireAnswers {
  decisionStyle?: string;
  pressureResponse?: string;
  relationshipPattern?: string;
  coreMotivation?: string;
  biggestChallenge?: string;
  energyStyle?: string;
  currentNeed?: string;
  selfPerception?: string;
}

function buildBehavioralContextBlock(answers: QuestionnaireAnswers | undefined | null): string {
  try {
    if (!answers || typeof answers !== "object") {
      return "BEHAVIORAL CONTEXT: The seeker has not yet completed the questionnaire. Lean primarily on the structural signals from their hand photographs and on their stated life questions.";
    }
    const lines: string[] = [];
    if (answers.decisionStyle)        lines.push(`- How they make decisions: ${answers.decisionStyle}`);
    if (answers.pressureResponse)     lines.push(`- Their response under pressure: ${answers.pressureResponse}`);
    if (answers.relationshipPattern)  lines.push(`- Their pattern in close relationships: ${answers.relationshipPattern}`);
    if (answers.coreMotivation)       lines.push(`- Their core motivation: ${answers.coreMotivation}`);
    if (answers.biggestChallenge)     lines.push(`- Their biggest internal challenge right now: ${answers.biggestChallenge}`);
    if (answers.energyStyle)          lines.push(`- How their energy moves through the day: ${answers.energyStyle}`);
    if (answers.currentNeed)          lines.push(`- What they most need right now: ${answers.currentNeed}`);
    if (answers.selfPerception)       lines.push(`- How they perceive themselves vs. how others see them: ${answers.selfPerception}`);
    if (lines.length === 0) {
      return "BEHAVIORAL CONTEXT: The seeker has not yet completed the questionnaire. Lean primarily on the structural signals from their hand photographs and on their stated life questions.";
    }
    return `BEHAVIORAL CONTEXT (from the seeker's own questionnaire — integrate naturally, never recite back as a list):\n${lines.join("\n")}`;
  } catch {
    return "BEHAVIORAL CONTEXT: The seeker has not yet completed the questionnaire. Lean primarily on the structural signals from their hand photographs and on their stated life questions.";
  }
}

function buildPalmAnalysisBlock(photoKeys: string[]): string {
  if (!photoKeys || photoKeys.length === 0) {
    return "HAND PHOTOGRAPH SIGNALS: No hand photographs were provided. Do not invent visual observations — work entirely from the behavioral context above and from the seeker's stated life questions.";
  }
  const which = photoKeys.includes("right_palm") && photoKeys.includes("left_palm")
    ? "both hands (dominant and non-dominant)"
    : photoKeys.includes("right_palm") ? "the dominant hand" : "the non-dominant hand";
  return `HAND PHOTOGRAPH SIGNALS: Photographs of ${which} are attached. Read them as structural signals only — proportion, symmetry, openness, tension, the way the form holds or releases. Translate those signals into behavioral patterns. When two hands are present, treat the dominant side as lived behaviour and the non-dominant side as original disposition; the gap between them is often the single most revealing thing about this person. Do not name palmistry lines, mounts, or chiromantic concepts. Do not predict events. Stay in behavioral language.`;
}

async function imageToBase64(buffer: Buffer, mimeType: string, maxPx: number): Promise<{ b64: string; mediaType: string }> {
  const sharp = (await import("sharp")).default;
  const resized = await sharp(buffer)
    .resize(maxPx, maxPx, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  return { b64: resized.toString("base64"), mediaType: "image/jpeg" };
}

const IMAGE_KEYS = ["right_palm","left_palm"] as const;

async function processUploadedImages(
  files: Record<string, Express.Multer.File[]> | undefined
): Promise<{ photoKeys: string[]; imageMap: Record<string, { b64: string; mediaType: string }> }> {
  const photoKeys: string[] = [];
  const imageMap: Record<string, { b64: string; mediaType: string }> = {};
  for (const key of IMAGE_KEYS) {
    const file = files?.[key]?.[0];
    if (file) {
      photoKeys.push(key);
      imageMap[key] = await imageToBase64(file.buffer, file.mimetype, 1200);
    }
  }
  return { photoKeys, imageMap };
}

function buildFreeSystemPrompt(photoKeys: string[], wordCount: string, behavioralContextBlock: string, palmAnalysisBlock: string): string {
  return `${ORACLE_PERSONA_BLOCK}

CORE EXECUTION RULES:
1. Speak directly to the seeker in second person ("you").
2. Every insight must be specific to the signals you have. No generic personality-quiz language.
3. Section flow: Observation → Interpretation → Pattern → one quietly confronting line.
4. Build from lighter to more direct as the reading progresses.
5. Do not predict events. Do not give time horizons. Do not invoke horoscope, numerology, zodiac, tarot, or any divinatory system.
6. Literary, fluid prose. No bullet points. No markdown headers. Section titles use: ✦ SECTION NAME. Each section ${wordCount} words. Vary sentence length for rhythm.

${behavioralContextBlock}

${palmAnalysisBlock}

Photos provided: ${photoKeys.join(", ") || "none"}

OUTPUT CONTROL:
Only generate the requested sections. No introductions. No summaries unless requested. Begin immediately with the first section title.`;
}

function buildPaidSystemPrompt(photoKeys: string[], wordCount: string, behavioralContextBlock: string, palmAnalysisBlock: string): string {
  return `${ORACLE_PERSONA_BLOCK}

These are the deeper sections of the reading. Be more direct. Earn the harder observations from the context the seeker has given you.

CORE RULES: Second person only. No generic language. No predictions. No horoscope, numerology, zodiac, or tarot vocabulary. Literary prose, no bullet points. Section titles: ✦ SECTION NAME. Each section ${wordCount} words.

${behavioralContextBlock}

${palmAnalysisBlock}

Photos: ${photoKeys.join(", ") || "none"}

For the archetype block at the end use this exact format:
✦ YOUR ARCHETYPE — [2–4 word behavioural archetype]
✦ CORE PATTERN LOOP — [the recurring loop in 3 named stages]
✦ PRIMARY BLOCK — [the one thing keeping them stuck, named directly]
✦ ACTIVATION KEY — [one specific behavioral shift they could try]

End the ENTIRE reading with ONE short, direct, unforgettable closing sentence on its own line.`;
}

const sseHeaders = (_req: Request, res: Response, next: () => void) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  next();
};

const imageFieldsRaw = upload.fields([
  { name: "right_palm", maxCount: 1 },
  { name: "left_palm", maxCount: 1 },
]);

const imageFields = (req: Request, res: Response, next: NextFunction) => {
  imageFieldsRaw(req, res, (err: any) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({ error: "File too large. Maximum size is 10MB per image." });
        return;
      }
      console.error("Upload error:", err);
      res.status(400).json({ error: "File upload failed." });
      return;
    }
    next();
  });
};

function parseQuestionnaire(raw: unknown): QuestionnaireAnswers | null {
  if (!raw) return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as QuestionnaireAnswers;
  } catch {
    return null;
  }
}

// POST /api/generate - SSE streaming endpoint (free sections)
router.post(
  "/generate",
  imageFields,
  sseHeaders,
  async (req: Request, res: Response) => {
    const sendEvent = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sendEvent({ event: "ping" });

    let resetTimeoutFn: (() => void) | null = null;
    const keepAlive = setInterval(() => {
      try {
        res.write(`data: ${JSON.stringify({ event: "ping" })}\n\n`);
        resetTimeoutFn?.();
      } catch {}
    }, 5000);
    const stopKeepAlive = () => clearInterval(keepAlive);
    res.on("close", stopKeepAlive);

    try {
      if (!anthropicApiKey) {
        stopKeepAlive();
        sendEvent({ event: "error", message: "The Oracle is temporarily unavailable." });
        res.end();
        return;
      }

      const userDataRaw = req.body.userData;
      let userData: Record<string, string> = {};
      try { userData = JSON.parse(userDataRaw); } catch (e) { console.error("Failed to parse userData:", e); }

      const questionnaireAnswers = parseQuestionnaire(req.body.questionnaireAnswers);

      const sessionId = req.body.sessionId ?? "default";
      const session = await getOrCreateSession(sessionId);
      session.paid = false;

      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const { photoKeys, imageMap } = await processUploadedImages(files);

      const fastMode = photoKeys.length === 1 && photoKeys[0] === "right_palm";
      const wordCount = fastMode ? "130–150" : "130–220";

      const hasPalmImages = photoKeys.some(k => k === "right_palm" || k === "left_palm");
      const behavioralContextBlock = buildBehavioralContextBlock(questionnaireAnswers);
      const palmAnalysisBlock = buildPalmAnalysisBlock(photoKeys);
      const systemPrompt = buildFreeSystemPrompt(photoKeys, wordCount, behavioralContextBlock, palmAnalysisBlock);

      const palmImages: Anthropic.ImageBlockParam[] = [];
      for (const k of ["right_palm","left_palm"]) {
        if (imageMap[k]) {
          palmImages.push({
            type: "image",
            source: { type: "base64", media_type: imageMap[k].mediaType as "image/jpeg", data: imageMap[k].b64 }
          });
        }
      }

      const lifeQs = [userData.q1, userData.q2, userData.q3].filter(Boolean);
      const questionsText = lifeQs.length > 0
        ? `\n\nLife questions from the seeker:\n${lifeQs.map((q,i) => `${i+1}. ${q}`).join("\n")}`
        : "";

      let fullReading = "";

      const call1Content: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam)[] = [
        ...palmImages,
        {
          type: "text",
          text: `Generate ONLY these two sections (do NOT generate any other sections):
✦ IDENTITY BLUEPRINT — who this person is at their core (${wordCount} words)
✦ INNER WIRING — emotional and psychological patterns (${wordCount} words)

End Section 2 with exactly this sentence: "Your behavioral profile points to a pattern worth examining more closely — the kind of pattern that, named clearly, helps you make a better next decision."${questionsText}`
        }
      ];

      try {
        const stream1 = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: "user", content: call1Content }]
        });

        let timeoutId: NodeJS.Timeout;
        const resetTimeout = () => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            stopKeepAlive();
            sendEvent({ event: "error", message: "The Oracle must rest. Please return in a few minutes." });
            res.end();
          }, 90000);
        };
        resetTimeoutFn = resetTimeout;
        resetTimeout();

        for await (const chunk of stream1) {
          resetTimeout();
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            const text = chunk.delta.text;
            fullReading += text;
            sendEvent({ section: "free", chunk: text });
          }
        }
        clearTimeout(timeoutId!);
      } catch (err) {
        req.log.error({ err }, "Anthropic call 1 failed");
        try {
          const fallback = await anthropic.messages.create({
            model: MODEL,
            max_tokens: 1500,
            system: systemPrompt,
            messages: [{
              role: "user",
              content: `Generate sections ✦ IDENTITY BLUEPRINT and ✦ INNER WIRING. End with: "Your behavioral profile points to a pattern worth examining more closely — the kind of pattern that, named clearly, helps you make a better next decision."`
            }]
          });
          const text = fallback.content[0].type === "text" ? fallback.content[0].text : "";
          fullReading += text;
          sendEvent({ section: "free", chunk: text });
        } catch {
          sendEvent({ event: "error", message: "The Oracle must rest. Please return in a few minutes." });
          res.end();
          return;
        }
      }

      session.reading = fullReading;
      session.hadPalmImages = hasPalmImages;
      await saveSession(sessionId, session);

      const behavioralResult = await computeBehavioralScores(fullReading, userData, req.log);
      sendEvent({ event: "behavioralScores", behavioralScores: behavioralResult.scores, scoresFallback: behavioralResult.scoresFallback });

      stopKeepAlive();
      sendEvent({ event: "paywall" });
      res.end();

    } catch (err) {
      stopKeepAlive();
      req.log.error({ err }, "Generate error");
      res.write(`data: ${JSON.stringify({ event: "error", message: "The Oracle is temporarily unavailable." })}\n\n`);
      res.end();
    }
  }
);

// POST /api/generate/continue - Stream paid sections after unlock
router.post(
  "/generate/continue",
  imageFields,
  sseHeaders,
  async (req: Request, res: Response) => {
    const abortController = new AbortController();
    const sendEvent = (data: object) => {
      if (res.writableEnded) return;
      try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch {}
    };

    sendEvent({ event: "ping" });

    let resetInactivityFn: (() => void) | null = null;
    const keepAlive = setInterval(() => {
      sendEvent({ event: "ping" });
      resetInactivityFn?.();
    }, 5000);
    const stopKeepAlive = () => clearInterval(keepAlive);
    res.on("close", () => {
      stopKeepAlive();
      abortController.abort();
    });

    try {
      if (!anthropicApiKey) {
        stopKeepAlive();
        sendEvent({ event: "error", message: "The Oracle is temporarily unavailable." });
        res.end();
        return;
      }

      const userDataRaw = req.body.userData;
      let userData: Record<string, string> = {};
      try { userData = JSON.parse(userDataRaw); } catch (e) { console.error("Failed to parse userData:", e); }

      const questionnaireAnswers = parseQuestionnaire(req.body.questionnaireAnswers);

      const sessionId = req.body.sessionId ?? "default";
      const session = await getOrCreateSession(sessionId);

      const rcAppUserId = req.body.rcAppUserId as string | undefined;
      const devSkip = req.body.devSkip === "true" || req.body.devSkip === true;

      if (!session.paid) {
        if (devSkip && process.env.NODE_ENV !== "production") {
          session.paid = true;
          await saveSession(sessionId, session);
        } else if (rcAppUserId) {
          try {
            const rcClient = await getUncachableRevenueCatClient();
            const projectId = process.env.REVENUECAT_PROJECT_ID ?? "";
            const { data: entitlements, error: entError } = await listCustomerActiveEntitlements({
              client: rcClient,
              path: { project_id: projectId, customer_id: rcAppUserId },
            });
            if (!entError && entitlements) {
              const hasAccess = entitlements.items?.some((e: any) => e.lookup_key === "full_reading");
              if (hasAccess) {
                session.paid = true;
                await saveSession(sessionId, session);
              }
            }
          } catch (e) {
            console.error("RevenueCat verification error:", e);
          }
        }

        if (!session.paid) {
          sendEvent({ event: "error", message: "Payment required." });
          res.end();
          return;
        }
      }

      // Backwards-compat: keep the old "TIMING & CYCLES" marker recognised
      // for sessions persisted before the rename. New generations use the
      // non-predictive "RHYTHMS & PATTERNS" header.
      const paidSectionHeaders = ["✦ EXTERNAL EXPRESSION", "✦ RHYTHMS & PATTERNS", "✦ TIMING & CYCLES", "✦ HIDDEN PATTERNS"];
      const existingReading = session.reading ?? "";
      const hasPaidSections = paidSectionHeaders.some(header => existingReading.includes(header));

      if (hasPaidSections && session.readingComplete) {
        const indices = paidSectionHeaders
          .map(h => existingReading.indexOf(h))
          .filter(i => i >= 0);
        const startIdx = indices.length > 0 ? Math.min(...indices) : 0;
        const paidContent = existingReading.substring(startIdx);

        const futureTimelineMarker = "✦ FUTURE TIMELINE";
        const archetypeMarkers = ["✦ YOUR ARCHETYPE", "✦ CORE PATTERN LOOP", "✦ PRIMARY BLOCK", "✦ ACTIVATION KEY"];

        const replaySections: { section: string; text: string }[] = [];

        const futureIdx = paidContent.indexOf(futureTimelineMarker);
        const archetypeIdx = archetypeMarkers.reduce((min, m) => {
          const idx = paidContent.indexOf(m);
          return idx >= 0 && (min < 0 || idx < min) ? idx : min;
        }, -1);

        let paidEnd = paidContent.length;
        if (futureIdx >= 0) paidEnd = Math.min(paidEnd, futureIdx);
        if (archetypeIdx >= 0) paidEnd = Math.min(paidEnd, archetypeIdx);

        const mainPaid = paidContent.substring(0, paidEnd);
        if (mainPaid.trim()) replaySections.push({ section: "paid", text: mainPaid });

        if (futureIdx >= 0 || archetypeIdx >= 0) {
          const archStart = futureIdx >= 0 ? futureIdx : archetypeIdx;
          replaySections.push({ section: "archetype", text: paidContent.substring(archStart) });
        }

        for (const { section, text } of replaySections) {
          const chunks = text.match(/.{1,80}/gs) ?? [text];
          for (const chunk of chunks) {
            sendEvent({ section, chunk });
          }
        }

        stopKeepAlive();
        sendEvent({ event: "complete" });
        if (!res.writableEnded) res.end();
        return;
      }

      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const { photoKeys, imageMap } = await processUploadedImages(files);

      const fastMode = photoKeys.length === 1 && photoKeys[0] === "right_palm";
      const wordCount = fastMode ? "130–150" : "130–220";

      const behavioralContextBlock = buildBehavioralContextBlock(questionnaireAnswers);
      const palmAnalysisBlock = buildPalmAnalysisBlock(photoKeys.length ? photoKeys : (session.hadPalmImages ? ["right_palm"] : []));
      const systemPrompt = buildPaidSystemPrompt(photoKeys, wordCount, behavioralContextBlock, palmAnalysisBlock);

      const lifeQs = [userData.q1, userData.q2, userData.q3].filter(Boolean);
      const questionsText = lifeQs.length > 0
        ? `\n\nTheir life questions: ${lifeQs.join(" | ")}`
        : "";

      const freeReadingSummary = session.reading ? `\n\nFirst two sections already given:\n${session.reading.substring(0, 600)}` : "";

      const call2Content: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam)[] = [
        {
          type: "text",
          text: `Generate ONLY these three sections:
✦ EXTERNAL EXPRESSION — how the world reads this person (${wordCount} words)
✦ RHYTHMS & PATTERNS — recurring behavioral cycles already visible in this person's profile, framed as patterns to recognize, NOT as predictions about future events (${wordCount} words)
✦ HIDDEN PATTERNS — what repeats below their awareness (${wordCount} words)${questionsText}${freeReadingSummary}`
        }
      ];

      const INACTIVITY_TIMEOUT_MS = 120000;
      let inactivityTimer: NodeJS.Timeout | undefined;
      let inactivityTimedOut = false;
      const resetInactivityTimeout = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
          inactivityTimedOut = true;
          abortController.abort();
          stopKeepAlive();
          sendEvent({ event: "error", message: "The Oracle's vision faded — the reading took too long. Please try again." });
          if (!res.writableEnded) res.end();
        }, INACTIVITY_TIMEOUT_MS);
      };
      resetInactivityFn = resetInactivityTimeout;

      try {
        let sectionReading = "";
        await withRetry(async () => {
          sectionReading = "";
          resetInactivityTimeout();
          const stream2 = anthropic.messages.stream({
            model: MODEL,
            max_tokens: 4000,
            system: systemPrompt,
            messages: [{ role: "user", content: call2Content }]
          });

          for await (const chunk of stream2) {
            if (inactivityTimedOut) return;
            resetInactivityTimeout();
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              const text = chunk.delta.text;
              sectionReading += text;
              sendEvent({ section: "paid", chunk: text });
            }
          }
        }, 2, "Call 2 (paid sections)");
        if (inactivityTimedOut) return;

        let call3Text = "";
        await withRetry(async () => {
          call3Text = "";
          resetInactivityTimeout();
          const stream3 = anthropic.messages.stream({
            model: MODEL,
            max_tokens: 4000,
            system: systemPrompt,
            messages: [{
              role: "user",
              content: `Generate ONLY these sections:
✦ FUTURE TIMELINE — what is forming and what to do next (${wordCount} words)

Then generate the archetype block using these EXACT headings:
✦ YOUR ARCHETYPE
✦ CORE PATTERN LOOP
✦ PRIMARY BLOCK
✦ ACTIVATION KEY

End with ONE final closing sentence.${questionsText}${freeReadingSummary}
${sectionReading ? `\nPrevious sections: ${sectionReading.substring(0, 400)}` : ""}`
            }]
          });

          for await (const chunk of stream3) {
            if (inactivityTimedOut) return;
            resetInactivityTimeout();
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              const text = chunk.delta.text;
              call3Text += text;
              sendEvent({ section: "archetype", chunk: text });
            }
          }
        }, 2, "Call 3 (archetype)");
        if (inactivityTimedOut) return;

        session.reading = session.reading + "\n" + sectionReading + "\n" + call3Text;
        if (inactivityTimedOut) return;

        clearTimeout(inactivityTimer);
        session.readingComplete = true;
        await saveSession(sessionId, session);
        stopKeepAlive();
        sendEvent({ event: "complete" });
      } catch (err) {
        clearTimeout(inactivityTimer);
        if (inactivityTimedOut) return;
        req.log.error({ err }, "Anthropic call 2/3 failed");
        stopKeepAlive();
        sendEvent({ event: "error", message: "The Oracle must rest. Please return in a few minutes." });
      }

      if (!res.writableEnded) res.end();
    } catch (err) {
      stopKeepAlive();
      req.log.error({ err }, "Continue error");
      sendEvent({ event: "error", message: "The Oracle is temporarily unavailable." });
      if (!res.writableEnded) res.end();
    }
  }
);

// POST /api/chat - Oracle chat with reading context
router.post("/chat", sseHeaders, async (req: Request, res: Response) => {
  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  sendEvent({ event: "ping" });

  const keepAlive = setInterval(() => {
    try { res.write(`data: ${JSON.stringify({ event: "ping" })}\n\n`); } catch {}
  }, 5000);
  const stopKeepAlive = () => clearInterval(keepAlive);
  res.on("close", stopKeepAlive);

  try {
    if (!anthropicApiKey) {
      sendEvent({ content: "The Oracle is temporarily unavailable." });
      sendEvent({ event: "done" });
      res.end();
      return;
    }

    const sessionId = req.body.sessionId ?? "default";
    const session = await getOrCreateSession(sessionId);

    session.messageCount = (session.messageCount ?? 0) + 1;
    await saveSession(sessionId, session);
    if (session.messageCount > 10) {
      sendEvent({ content: "The Oracle must rest. Return tomorrow for more." });
      sendEvent({ event: "done" });
      res.end();
      return;
    }

    const messages: { role: string; content: string }[] = req.body.messages ?? [];
    const readingSummary: string = req.body.readingSummary ?? session.reading?.substring(0, 800) ?? "";
    const questionnaireAnswers = parseQuestionnaire(req.body.questionnaireAnswers);
    const behavioralContextBlock = buildBehavioralContextBlock(questionnaireAnswers);
    const palmAnalysisBlock = buildPalmAnalysisBlock(session.hadPalmImages ? ["right_palm"] : []);

    const systemPrompt = `${ORACLE_PERSONA_BLOCK}

You have already produced this person's behavioral profile from their hand photographs and questionnaire answers. You know their archetype, their core pattern, their primary block, and their activation key. You speak with quiet certainty. You do not explain your methods. You do not hedge. You do not add disclaimers. You answer as if you already know what is relevant about this person.

Their reading summary is: ${readingSummary || "The full reading has not yet been completed."}

${behavioralContextBlock}

${palmAnalysisBlock}

Rules:
- Always respond in second person ("you").
- Responses: 80–180 words unless a longer answer is genuinely required.
- Literary, measured tone — not chatty.
- Reference their specific reading details when relevant.
- Speak in patterns, not predictions. No future events, no time horizons, no horoscope/numerology/zodiac/tarot vocabulary.
- Never break character.
- If the question is outside your domain, redirect: "The Oracle reads patterns, not specifics. But what I can see is..."`;

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 400,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
      }))
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        sendEvent({ content: chunk.delta.text });
      }
    }

    stopKeepAlive();
    sendEvent({ event: "done" });
    res.end();
  } catch (err) {
    stopKeepAlive();
    req.log.error({ err }, "Chat error");
    res.write(`data: ${JSON.stringify({ content: "The Oracle is temporarily unavailable. Please try again." })}\n\n`);
    res.write(`data: ${JSON.stringify({ event: "done" })}\n\n`);
    res.end();
  }
});

// POST /api/chat/followups - Generate 3 follow-up question chips after Oracle response
router.post("/chat/followups", async (req: Request, res: Response) => {
  try {
    if (!anthropicApiKey) {
      res.status(200).json({ followups: [] });
      return;
    }

    const { lastResponse, conversationContext } = req.body as {
      lastResponse: string;
      conversationContext?: string;
    };

    if (!lastResponse || typeof lastResponse !== "string") {
      res.status(400).json({ error: "lastResponse is required" });
      return;
    }

    const systemPrompt = `You are The Oracle's inner voice, crafting questions that pull the seeker deeper into self-discovery.

Generate exactly 3 follow-up questions the seeker might want to ask next. Each question must:
- Explore a DISTINCT facet: one probing the past root, one the present pattern, one the becoming — or vary as fear / desire / truth, or shadow / gift / threshold
- Be written in the Oracle's voice — evocative, slightly unsettling, emotionally charged
- Be 8–14 words, no filler, no pleasantries
- Feel like it was ripped from the seeker's own unspoken thoughts

Return ONLY a JSON array of exactly 3 strings. No other text. No explanation. Example format:
["Question one here?", "Question two here?", "Question three here?"]`;

    const contextNote = conversationContext
      ? `\n\nConversation context:\n${conversationContext.substring(0, 400)}`
      : "";

    const result = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 200,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: `The Oracle just said:\n\n${lastResponse.substring(0, 1000)}${contextNote}\n\nGenerate 3 follow-up questions now.`
      }]
    });

    const text = result.content[0].type === "text" ? result.content[0].text.trim() : "[]";

    let followups: string[] = [];
    try {
      const match = text.match(/\[[\s\S]*\]/);
      const parsed = match ? JSON.parse(match[0]) : [];
      if (
        Array.isArray(parsed) &&
        parsed.length === 3 &&
        parsed.every((q): q is string => typeof q === "string" && q.trim().length > 0)
      ) {
        followups = parsed.map((q: string) => q.trim());
      }
    } catch {
      followups = [];
    }

    res.status(200).json({ followups });
  } catch (err) {
    req.log.error({ err }, "Followups error");
    res.status(200).json({ followups: [] });
  }
});

// POST /api/synastry - SSE compatibility reading for two profiles
router.post("/synastry", sseHeaders, async (req: Request, res: Response) => {
  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  sendEvent({ event: "ping" });

  const keepAlive = setInterval(() => {
    try { res.write(`data: ${JSON.stringify({ event: "ping" })}\n\n`); } catch {}
  }, 5000);
  const stopKeepAlive = () => clearInterval(keepAlive);
  res.on("close", stopKeepAlive);

  try {
    const { profile1, profile2 } = req.body as {
      profile1: { name: string; gender?: string; dominantHand?: string; eyeColor?: string; notes?: string; photos: string[]; questionnaireAnswers?: QuestionnaireAnswers };
      profile2: { name: string; gender?: string; dominantHand?: string; eyeColor?: string; notes?: string; photos: string[]; questionnaireAnswers?: QuestionnaireAnswers };
    };

    if (!profile1?.name || !profile2?.name) {
      stopKeepAlive();
      sendEvent({ event: "error", message: "Two complete profiles are required for this reading." });
      res.end();
      return;
    }

    const p1Block = buildBehavioralContextBlock(profile1.questionnaireAnswers);
    const p2Block = buildBehavioralContextBlock(profile2.questionnaireAnswers);
    const p1Palm = buildPalmAnalysisBlock(profile1.photos ?? []);
    const p2Palm = buildPalmAnalysisBlock(profile2.photos ?? []);

    const systemPrompt = `${ORACLE_PERSONA_BLOCK}

You are reading the dynamic between two specific people. Your only sources are (a) what each person told you through their questionnaire and (b) the structural signals visible in any hand photographs they shared. Speak directly to both of them about how they actually fit, where they catch on each other, and what this connection tends to activate or expose. No horoscope, no synastry-by-chart, no numerological compatibility, no predictions.

CRITICAL RULES:
1. Speak directly to both people — "between you two", "in your connection", "for ${profile1.name}", "for ${profile2.name}".
2. Specific, not generic. Name patterns, not destinies.
3. Honest about what is beautiful AND what is dangerous in this combination.
4. Build the reading from both behavioral profiles below — never invent traits the data doesn't support.
5. No bullet points, no markdown headers, literary prose.

YOUR OUTPUT STRUCTURE (use these exact headers with ✦):
✦ THE BRIDGE — what brings these two together
✦ THE MAGNETIC DYNAMIC — attraction and repulsion forces
✦ THE CHALLENGE POINT — the one pattern that will test this bond
✦ THE GIFT — what this connection uniquely activates in each person
✦ THE TRAJECTORY — where this connection is heading if both keep showing up the way they currently do

Each section 100–150 words.`;

    const userContent = `Perform a complete relationship reading for these two people:

${profile1.name.toUpperCase()}
${p1Block}
${p1Palm}
${profile1.gender ? `Gender: ${profile1.gender}` : ""}${profile1.dominantHand ? ` | Dominant Hand: ${profile1.dominantHand}` : ""}${profile1.eyeColor ? ` | Eye Color: ${profile1.eyeColor}` : ""}

${profile2.name.toUpperCase()}
${p2Block}
${p2Palm}
${profile2.gender ? `Gender: ${profile2.gender}` : ""}${profile2.dominantHand ? ` | Dominant Hand: ${profile2.dominantHand}` : ""}${profile2.eyeColor ? ` | Eye Color: ${profile2.eyeColor}` : ""}

Generate the full reading now.`;

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 1800,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        sendEvent({ chunk: chunk.delta.text });
      }
    }

    stopKeepAlive();
    sendEvent({ event: "complete" });
    res.end();
  } catch (err) {
    stopKeepAlive();
    req.log.error({ err }, "Synastry error");
    sendEvent({ event: "error", message: "The Oracle could not complete this reading." });
    res.end();
  }
});

// POST /api/synastry/chat - Oracle chat in synastry context
router.post("/synastry/chat", sseHeaders, async (req: Request, res: Response) => {
  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  sendEvent({ event: "ping" });

  const keepAlive = setInterval(() => {
    try { res.write(`data: ${JSON.stringify({ event: "ping" })}\n\n`); } catch {}
  }, 5000);
  const stopKeepAlive = () => clearInterval(keepAlive);
  res.on("close", stopKeepAlive);

  try {
    const { messages, readingSummary, profile1, profile2 } = req.body as {
      messages?: { role: string; content: string }[];
      readingSummary?: string;
      profile1?: { name: string; photos?: string[]; questionnaireAnswers?: QuestionnaireAnswers };
      profile2?: { name: string; photos?: string[]; questionnaireAnswers?: QuestionnaireAnswers };
    };

    const p1Name = profile1?.name ?? "Person 1";
    const p2Name = profile2?.name ?? "Person 2";
    const p1Block = buildBehavioralContextBlock(profile1?.questionnaireAnswers);
    const p2Block = buildBehavioralContextBlock(profile2?.questionnaireAnswers);
    const p1Palm = buildPalmAnalysisBlock(profile1?.photos ?? []);
    const p2Palm = buildPalmAnalysisBlock(profile2?.photos ?? []);

    const systemPrompt = `${ORACLE_PERSONA_BLOCK}

You have just completed a relationship reading for ${p1Name} and ${p2Name}.

Reading summary:
${readingSummary ?? "No summary provided."}

${p1Name}'s ${p1Block}
${p1Name}'s ${p1Palm}

${p2Name}'s ${p2Block}
${p2Name}'s ${p2Palm}

Answer their follow-up questions about this specific connection with depth and precision.
- Reference both individuals by name.
- Ground every observation in the behavioral context above.
- Speak about patterns, never destinies. No predictions, no horoscope/numerology/zodiac/tarot vocabulary.
- 100–200 words per response. Second person. No generic advice.
- Never break character.`;

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 500,
      system: systemPrompt,
      messages: (messages ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        sendEvent({ content: chunk.delta.text });
      }
    }

    stopKeepAlive();
    sendEvent({ event: "done" });
    res.end();
  } catch (err) {
    stopKeepAlive();
    req.log.error({ err }, "Synastry chat error");
    sendEvent({ content: "The Oracle is temporarily unavailable. Please try again." });
    sendEvent({ event: "done" });
    res.end();
  }
});

// POST /api/deep-dive - SSE deep dive reading for a life category
router.post("/deep-dive", sseHeaders, async (req: Request, res: Response) => {
  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  sendEvent({ event: "ping" });

  const keepAlive = setInterval(() => {
    try { res.write(`data: ${JSON.stringify({ event: "ping" })}\n\n`); } catch {}
  }, 5000);
  const stopKeepAlive = () => clearInterval(keepAlive);
  res.on("close", stopKeepAlive);

  try {
    if (!anthropicApiKey) {
      stopKeepAlive();
      sendEvent({ event: "error", message: "The Oracle is temporarily unavailable." });
      res.end();
      return;
    }

    const { sessionId, category, categoryData, userData, questionnaireAnswers: rawQA } = req.body as {
      sessionId: string;
      category: string;
      categoryData: Record<string, string>;
      userData: Record<string, string>;
      questionnaireAnswers?: unknown;
    };

    if (!category || !userData) {
      stopKeepAlive();
      sendEvent({ event: "error", message: "Missing required fields." });
      res.end();
      return;
    }

    const session = sessionId ? await getOrCreateSession(sessionId) : null;
    if (!session || !session.readingComplete) {
      stopKeepAlive();
      sendEvent({ event: "error", message: "Complete your full Oracle reading before accessing Deep Dives." });
      res.end();
      return;
    }

    const name = userData.name ?? "Seeker";
    const questionnaireAnswers = parseQuestionnaire(rawQA);
    const behavioralContextBlock = buildBehavioralContextBlock(questionnaireAnswers);
    const palmAnalysisBlock = buildPalmAnalysisBlock(session.hadPalmImages ? ["right_palm"] : []);

    const readingContext = session.reading
      ? `\n\nThis person's main Oracle reading (key themes for context):\n${session.reading.substring(0, 700)}`
      : "";

    const categoryPrompts: Record<string, string> = {
      career: `Perform a deep dive CAREER reading. Category data: Occupation/Industry: "${categoryData.occupation ?? "not specified"}", Career Goal: "${categoryData.goal ?? "not specified"}", Biggest Challenge: "${categoryData.challenge ?? "not specified"}", Timeline: "${categoryData.timeline ?? "not specified"}". Generate ONLY this single section: ✦ CAREER PROFILE — work from the behavioral context to address the specific goal and challenge they named. Reveal the patterns driving their professional trajectory. Speak to what tends to help and what tends to get in the way. 200–260 words. No predictions.`,
      relationship: `Perform a deep dive RELATIONSHIP reading. Category data: Status: "${categoryData.status ?? "not specified"}", Partner Name: "${categoryData.partnerName ?? "none given"}", Relationship Goal: "${categoryData.goal ?? "not specified"}", Recurring Pattern: "${categoryData.pattern ?? "not specified"}". Generate ONLY this single section: ✦ RELATIONSHIP PROFILE — work from the behavioral context to address the goal and pattern they shared. Name what is drawing in and what is pushing away. Speak to the repeating pattern with precision. 200–260 words. No predictions.`,
      finances: `Perform a deep dive FINANCES reading. Category data: Current Situation: "${categoryData.situation ?? "not specified"}", Primary Goal: "${categoryData.goal ?? "not specified"}", Biggest Money Block: "${categoryData.block ?? "not specified"}", Timeline Goal: "${categoryData.timeline ?? "not specified"}". Generate ONLY this single section: ✦ MONEY PROFILE — read the financial pattern through the behavioral context. Address the specific goal and block they named. Speak to what their decision style and pressure response tend to do around money. 200–260 words. No predictions.`,
      fitness: `Perform a deep dive FITNESS reading. Category data: Current Routine: "${categoryData.routine ?? "not specified"}", Primary Goal: "${categoryData.goal ?? "not specified"}", Health Concerns: "${categoryData.concerns ?? "none specified"}", Desired Lifestyle Change: "${categoryData.lifestyle ?? "not specified"}". Generate ONLY this single section: ✦ BODY PROFILE — read their pattern around energy, follow-through, and physical practice through the behavioral context. Address the goal and desired change. Speak to what the body tends to register about how they live. 200–260 words. No predictions.`,
      family: `Perform a deep dive FAMILY reading. Category data: Children/Ages: "${categoryData.children ?? "not specified"}", Family Role: "${categoryData.role ?? "not specified"}", Biggest Challenge: "${categoryData.challenge ?? "not specified"}", Family Goal: "${categoryData.goal ?? "not specified"}". Generate ONLY this single section: ✦ FAMILY PROFILE — read the family thread through the behavioral context. Address the challenge they named as a pattern. Speak to the family goal with precision about what tends to need to shift for it to settle. 200–260 words. No predictions.`,
    };

    const categoryPrompt = categoryPrompts[category];
    if (!categoryPrompt) {
      stopKeepAlive();
      sendEvent({ event: "error", message: "Unknown category." });
      res.end();
      return;
    }

    const systemPrompt = `${ORACLE_PERSONA_BLOCK}

You are now performing a targeted deep dive for one specific area of this person's life. They should feel seen in this area with the same depth as their main reading.

CRITICAL RULES:
1. Second person only ("you").
2. No generic language — every line must feel specific.
3. Work from the behavioral context below — never invent traits the data doesn't support.
4. Reference the main reading context if available — create continuity.
5. One quietly confronting line per response: name a hidden truth about this category in their life.
6. Literary, immersive prose. No bullet points. Section title: ✦ [TITLE].
7. No predictions, no time horizons, no horoscope/numerology/zodiac/tarot vocabulary.

SEEKER NAME: ${name}
${userData.gender ? `Gender: ${userData.gender}` : ""}

${behavioralContextBlock}

${palmAnalysisBlock}
${readingContext}`;

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: categoryPrompt }],
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        sendEvent({ chunk: chunk.delta.text });
      }
    }

    stopKeepAlive();
    sendEvent({ event: "complete" });
    res.end();
  } catch (err) {
    stopKeepAlive();
    req.log.error({ err }, "Deep dive error");
    sendEvent({ event: "error", message: "The Oracle could not complete this reading. Please try again." });
    res.end();
  }
});

// POST /api/profile-reading - Oracle reading for a single vault profile
router.post("/profile-reading", sseHeaders, async (req: Request, res: Response) => {
  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  sendEvent({ event: "ping" });

  const keepAlive = setInterval(() => {
    try { res.write(`data: ${JSON.stringify({ event: "ping" })}\n\n`); } catch {}
  }, 5000);
  const stopKeepAlive = () => clearInterval(keepAlive);
  res.on("close", stopKeepAlive);

  try {
    const { profile, category } = req.body as {
      profile: { name: string; gender?: string; dominantHand?: string; eyeColor?: string; notes?: string; photos: string[]; questionnaireAnswers?: QuestionnaireAnswers };
      category: string;
    };

    if (!profile?.name || !category) {
      stopKeepAlive();
      sendEvent({ event: "error", message: "Profile and category are required." });
      res.end();
      return;
    }

    const behavioralContextBlock = buildBehavioralContextBlock(profile.questionnaireAnswers);
    const palmAnalysisBlock = buildPalmAnalysisBlock(profile.photos ?? []);

    const systemPrompt = `${ORACLE_PERSONA_BLOCK}

You have been given the profile of ${profile.name}, and you are delivering a focused reading on their ${category}.

CRITICAL RULES:
1. Speak directly to ${profile.name} — use "you" exclusively.
2. Work from the behavioral context below. Never invent traits the data doesn't support.
3. CATEGORY FOCUS: everything in this reading relates to ${category}.
4. DEPTH OVER BREADTH: one precise observation is worth ten generic ones.
5. CONFRONTATIONAL HONESTY: name the hidden pattern or block in this area of their life.
6. CLOSE with one actionable piece of guidance — specific to who they are, not generic advice.
7. No predictions, no time horizons, no horoscope/numerology/zodiac/tarot vocabulary.

${behavioralContextBlock}

${palmAnalysisBlock}

TONE: Direct, compassionate, unflinching. Literary prose, no bullet points.

STRUCTURE: One flowing reading of 200–280 words. Section title: ✦ ${category.toUpperCase()}`;

    const userContent = `Deliver a focused Oracle reading for ${profile.name} on the topic of: ${category}

Profile data:
Name: ${profile.name}
${profile.gender ? `Gender: ${profile.gender}` : ""}${profile.dominantHand ? ` | Dominant Hand: ${profile.dominantHand}` : ""}${profile.eyeColor ? ` | Eye Color: ${profile.eyeColor}` : ""}
Hand photographs available: ${profile.photos.length > 0 ? profile.photos.join(", ") : "none"}
${profile.notes ? `Notes: ${profile.notes}` : ""}

Generate the reading now.`;

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        sendEvent({ chunk: chunk.delta.text });
      }
    }

    stopKeepAlive();
    sendEvent({ event: "complete" });
    res.end();
  } catch (err) {
    stopKeepAlive();
    req.log.error({ err }, "Profile reading error");
    sendEvent({ event: "error", message: "The Oracle could not complete this reading." });
    res.end();
  }
});

// POST /api/profile-reading/chat - Follow-up Oracle chat for a profile reading
router.post("/profile-reading/chat", sseHeaders, async (req: Request, res: Response) => {
  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  sendEvent({ event: "ping" });

  const keepAlive = setInterval(() => {
    try { res.write(`data: ${JSON.stringify({ event: "ping" })}\n\n`); } catch {}
  }, 5000);
  const stopKeepAlive = () => clearInterval(keepAlive);
  res.on("close", stopKeepAlive);

  try {
    const { profile, category, messages } = req.body as {
      profile: { name?: string; notes?: string; photos?: string[]; questionnaireAnswers?: QuestionnaireAnswers };
      category?: string;
      messages?: { role: string; content: string }[];
    };

    const behavioralContextBlock = buildBehavioralContextBlock(profile?.questionnaireAnswers);
    const palmAnalysisBlock = buildPalmAnalysisBlock(profile?.photos ?? []);

    const systemPrompt = `${ORACLE_PERSONA_BLOCK}

You have just delivered a reading for ${profile?.name ?? "this person"} on the topic of ${category ?? "life"}.

${behavioralContextBlock}

${palmAnalysisBlock}
${profile?.notes ? `Notes: ${profile.notes}` : ""}

Answer their follow-up questions with depth and precision. Work entirely from the behavioral context above.
- Always speak in second person ("you").
- 80–150 words per response.
- Literary, measured tone — not chatty.
- Stay focused on ${category ?? "the reading"} unless they redirect.
- Speak in patterns, not predictions. No horoscope/numerology/zodiac/tarot vocabulary.
- Never break character.`;

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 400,
      system: systemPrompt,
      messages: (messages ?? []).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        sendEvent({ content: chunk.delta.text });
      }
    }

    stopKeepAlive();
    sendEvent({ event: "done" });
    res.end();
  } catch (err) {
    stopKeepAlive();
    req.log.error({ err }, "Profile reading chat error");
    sendEvent({ content: "The Oracle is temporarily unavailable. Please try again." });
    sendEvent({ event: "done" });
    res.end();
  }
});

const BEHAVIORAL_DIMENSIONS = [
  "intuition",
  "emotionalDepth",
  "drive",
  "adaptability",
  "innerKnowing",
  "expression",
] as const;

type BehavioralDimension = typeof BEHAVIORAL_DIMENSIONS[number];

function clampScore(n: unknown): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  if (n > 1.5) return Math.max(0, Math.min(1, n / 100));
  return Math.max(0, Math.min(1, n));
}

const DEFAULT_BEHAVIORAL_SCORES: Record<BehavioralDimension, number> = {
  intuition: 0.5,
  emotionalDepth: 0.5,
  drive: 0.5,
  adaptability: 0.5,
  innerKnowing: 0.5,
  expression: 0.5,
};

async function computeBehavioralScores(
  reading: string,
  userData: Record<string, string> | undefined,
  log: { error: (...args: unknown[]) => void },
): Promise<{ scores: Record<BehavioralDimension, number>; scoresFallback: boolean }> {
  if (!anthropicApiKey || !reading.trim()) return { scores: { ...DEFAULT_BEHAVIORAL_SCORES }, scoresFallback: true };

  try {
    const ud = userData ?? {};
    const name = ud.name ?? "Seeker";
    const dominantHand = ud.dominantHand ?? "unspecified";

    const systemPrompt = `You are The Oracle, distilling a completed behavioral reading into six behavioral dimension scores.

Return ONLY a single JSON object with these exact keys, each a number between 0.0 and 1.0:
- intuition
- emotionalDepth
- drive
- adaptability
- innerKnowing
- expression

RULES:
- Output ONLY the JSON object, no prose, no markdown, no code fence.
- Each value must be a real number with at least two decimals (e.g. 0.62), in [0, 1].
- Use the full range — do NOT cluster every score near 0.5 or 0.8.
- Ground each score in the behavioral reading text and the seeker's profile data.

Seeker context:
Name: ${name}
Dominant Hand: ${dominantHand}`;

    const userContent = `This is the Oracle reading already delivered to ${name}:

"""
${reading.substring(0, 6000)}
"""

Produce the JSON object now.`;

    const result = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    const text = result.content[0]?.type === "text" ? result.content[0].text.trim() : "";
    if (!text) return { scores: { ...DEFAULT_BEHAVIORAL_SCORES }, scoresFallback: true };

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { scores: { ...DEFAULT_BEHAVIORAL_SCORES }, scoresFallback: true };
    }
    if (!parsed || typeof parsed !== "object") {
      return { scores: { ...DEFAULT_BEHAVIORAL_SCORES }, scoresFallback: true };
    }

    const out: Partial<Record<BehavioralDimension, number>> = {};
    for (const dim of BEHAVIORAL_DIMENSIONS) {
      const v = clampScore(parsed[dim]);
      if (v === null) return { scores: { ...DEFAULT_BEHAVIORAL_SCORES }, scoresFallback: true };
      out[dim] = v;
    }
    return { scores: out as Record<BehavioralDimension, number>, scoresFallback: false };
  } catch (err) {
    log.error({ err }, "Behavioral scoring failed; returning defaults");
    return { scores: { ...DEFAULT_BEHAVIORAL_SCORES }, scoresFallback: true };
  }
}

router.post("/behavioral-profile", async (req: Request, res: Response) => {
  try {
    const { sessionId, userData } = req.body as {
      sessionId?: string;
      userData?: Record<string, string>;
    };

    if (!sessionId) {
      res.status(200).json({
        behavioralScores: { ...DEFAULT_BEHAVIORAL_SCORES },
        scoresFallback: true,
      });
      return;
    }

    const session = await getOrCreateSession(sessionId);
    const reading = (session.reading ?? "").trim();
    const result = await computeBehavioralScores(reading, userData, req.log);
    res.status(200).json({ behavioralScores: result.scores, scoresFallback: result.scoresFallback });
  } catch (err) {
    req.log.error({ err }, "Behavioral profile error (returning defaults)");
    res.status(200).json({
      behavioralScores: { ...DEFAULT_BEHAVIORAL_SCORES },
      scoresFallback: true,
    });
  }
});

// POST /api/expand - Stream an expanded Oracle response for a selected paragraph
router.post("/expand", sseHeaders, async (req: Request, res: Response) => {
  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  sendEvent({ event: "ping" });

  const keepAlive = setInterval(() => {
    try { res.write(`data: ${JSON.stringify({ event: "ping" })}\n\n`); } catch {}
  }, 5000);
  const stopKeepAlive = () => clearInterval(keepAlive);
  res.on("close", stopKeepAlive);

  try {
    if (!anthropicApiKey) {
      stopKeepAlive();
      sendEvent({ event: "error", message: "The Oracle is temporarily unavailable." });
      res.end();
      return;
    }

    const { sessionId, userData: userDataRaw, selectedText, mode, questionnaireAnswers: rawQA } = req.body as {
      sessionId?: string;
      userData?: string;
      selectedText?: string;
      mode?: "go_deeper" | "expand";
      questionnaireAnswers?: unknown;
    };

    if (!selectedText || typeof selectedText !== "string" || selectedText.trim().length < 10) {
      stopKeepAlive();
      sendEvent({ event: "error", message: "No passage selected." });
      res.end();
      return;
    }

    let userData: Record<string, string> = {};
    try { if (userDataRaw) userData = JSON.parse(userDataRaw); } catch (e) { console.error("Failed to parse userData:", e); }

    const session = sessionId ? await getOrCreateSession(sessionId) : null;

    if (!session?.paid) {
      stopKeepAlive();
      sendEvent({ event: "error", message: "This feature requires the full reading." });
      res.end();
      return;
    }

    const name = userData.name ?? "Seeker";
    const questionnaireAnswers = parseQuestionnaire(rawQA);
    const behavioralContextBlock = buildBehavioralContextBlock(questionnaireAnswers);
    const palmAnalysisBlock = buildPalmAnalysisBlock(session.hadPalmImages ? ["right_palm"] : []);

    const modeInstruction = mode === "go_deeper"
      ? `Go significantly deeper into the layers beneath this passage. Excavate the hidden psychological roots, the patterns underneath, the structural reason this lands the way it does. Do not repeat what was already written. Go further inward — more specific, more confronting, more precise. Reveal what the original passage only hinted at.`
      : `Expand upon this passage with additional breadth and context. Explore adjacent dimensions — how this pattern shows up in relationships, work, body, and daily life. Trace its origins and the situations where it tends to recur. Do not predict the future. Do not repeat what was already written. Build outward from this insight with new territory.`;

    const systemPrompt = `${ORACLE_PERSONA_BLOCK}

You are now responding to a seeker who has asked you to illuminate a specific passage of their reading further.

${modeInstruction}

RULES:
- Speak directly to the seeker in second person ("you").
- Do NOT repeat or paraphrase the selected passage itself.
- Do NOT use bullet points or markdown headers.
- Write in the Oracle's signature literary, immersive prose.
- 200–350 words, with rhythm and weight.
- End with a single, direct confronting sentence that lands like a truth they have been avoiding.
- No predictions, no time horizons, no horoscope/numerology/zodiac/tarot vocabulary.

SEEKER NAME: ${name}

${behavioralContextBlock}

${palmAnalysisBlock}`;

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 800,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: `The seeker has highlighted this passage from their reading:\n\n"${selectedText.trim()}"\n\nExpand on this now.`
      }]
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        sendEvent({ chunk: chunk.delta.text });
      }
    }

    stopKeepAlive();
    sendEvent({ event: "done" });
    res.end();
  } catch (err) {
    stopKeepAlive();
    req.log.error({ err }, "Expand error");
    sendEvent({ event: "error", message: "The Oracle must rest. Please try again." });
    res.end();
  }
});

export default router;
