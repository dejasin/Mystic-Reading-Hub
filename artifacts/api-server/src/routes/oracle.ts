import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { db, sessionsTable } from "@workspace/db";
import { getUncachableRevenueCatClient } from "../lib/revenueCatClient.js";
import { listCustomerActiveEntitlements } from "@replit/revenuecat-sdk";
import { computeSunSign, reduceDigits, computeLifePath } from "../lib/astro.js";

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
    // Move to end (most recently used)
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

const PYTHAGOREAN: Record<string, number> = {
  a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,
  j:1,k:2,l:3,m:4,n:5,o:6,p:7,q:8,r:9,
  s:1,t:2,u:3,v:4,w:5,x:6,y:7,z:8
};

const CHALDEAN: Record<string, number> = {
  a:1,b:2,c:3,d:4,e:5,f:8,g:3,h:5,i:1,
  j:1,k:2,l:3,m:4,n:5,o:7,p:8,q:1,r:2,
  s:3,t:4,u:6,v:6,w:6,x:5,y:1,z:7
};

const VOWELS = new Set(["a","e","i","o","u"]);

function nameToNumber(name: string, onlyVowels = false): number {
  const chars = name.toLowerCase().replace(/[^a-z]/g, "").split("");
  const filtered = onlyVowels ? chars.filter(c => VOWELS.has(c)) : chars;
  const sum = filtered.reduce((a, c) => a + (PYTHAGOREAN[c] ?? 0), 0);
  return reduceDigits(sum);
}

function nameToNumberConsonants(name: string): number {
  const chars = name.toLowerCase().replace(/[^a-z]/g, "").split("");
  const consonants = chars.filter(c => !VOWELS.has(c));
  const sum = consonants.reduce((a, c) => a + (PYTHAGOREAN[c] ?? 0), 0);
  return reduceDigits(sum);
}

function chaldeanNameNumber(name: string): number {
  const chars = name.toLowerCase().replace(/[^a-z]/g, "").split("");
  const sum = chars.reduce((a, c) => a + (CHALDEAN[c] ?? 0), 0);
  return reduceDigits(sum);
}

function chaldeanHeartsDesire(name: string): number {
  const chars = name.toLowerCase().replace(/[^a-z]/g, "").split("");
  const vowels = chars.filter(c => VOWELS.has(c));
  const sum = vowels.reduce((a, c) => a + (CHALDEAN[c] ?? 0), 0);
  return reduceDigits(sum);
}

function chaldeanPersonality(name: string): number {
  const chars = name.toLowerCase().replace(/[^a-z]/g, "").split("");
  const consonants = chars.filter(c => !VOWELS.has(c));
  const sum = consonants.reduce((a, c) => a + (CHALDEAN[c] ?? 0), 0);
  return reduceDigits(sum);
}

function computeBirthdayNumber(dob: string): number {
  const day = new Date(dob).getUTCDate();
  return day;
}

function computeMaturityNumber(lifePath: number, expressionNum: number): number {
  return reduceDigits(lifePath + expressionNum);
}

const KARMIC_DEBT_NUMBERS = new Set([13, 14, 16, 19]);

function detectKarmicDebt(dob: string, name: string): number[] {
  const debts: number[] = [];

  // Life Path raw sum
  const lifePathDigits = dob.replace(/-/g, "").split("").map(Number);
  const rawLifePath = lifePathDigits.reduce((a, b) => a + b, 0);
  if (KARMIC_DEBT_NUMBERS.has(rawLifePath)) debts.push(rawLifePath);

  const letters = name.toLowerCase().replace(/[^a-z]/g, "").split("");

  // Expression (full name) raw sum
  const rawExpression = letters.reduce((a, c) => a + (PYTHAGOREAN[c] ?? 0), 0);
  if (KARMIC_DEBT_NUMBERS.has(rawExpression)) debts.push(rawExpression);

  // Soul Urge (vowels) raw sum
  const rawSoulUrge = letters.filter(c => VOWELS.has(c)).reduce((a, c) => a + (PYTHAGOREAN[c] ?? 0), 0);
  if (KARMIC_DEBT_NUMBERS.has(rawSoulUrge)) debts.push(rawSoulUrge);

  // Personality (consonants) raw sum
  const rawPersonality = letters.filter(c => !VOWELS.has(c)).reduce((a, c) => a + (PYTHAGOREAN[c] ?? 0), 0);
  if (KARMIC_DEBT_NUMBERS.has(rawPersonality)) debts.push(rawPersonality);

  return [...new Set(debts)];
}

interface NumerologyProfile {
  lifePath: number;
  expressionNum: number;
  soulUrge: number;
  personalityNum: number;
  birthdayNum: number;
  maturityNum: number;
  karmicDebts: number[];
  chaldeanName: number;
  chaldeanHeartsDesire: number;
  chaldeanPersonality: number;
}

function computeFullNumerology(dob: string, name: string): NumerologyProfile {
  const lifePath = dob ? computeLifePath(dob) : 0;
  const expressionNum = name ? nameToNumber(name) : 0;
  const soulUrge = name ? nameToNumber(name, true) : 0;
  const personalityNum = name ? nameToNumberConsonants(name) : 0;
  const birthdayNum = dob ? computeBirthdayNumber(dob) : 0;
  const maturityNum = computeMaturityNumber(lifePath, expressionNum);
  const karmicDebts = (dob && name) ? detectKarmicDebt(dob, name) : [];
  const chaldName = name ? chaldeanNameNumber(name) : 0;
  const chaldHD = name ? chaldeanHeartsDesire(name) : 0;
  const chaldPers = name ? chaldeanPersonality(name) : 0;
  return {
    lifePath,
    expressionNum,
    soulUrge,
    personalityNum,
    birthdayNum,
    maturityNum,
    karmicDebts,
    chaldeanName: chaldName,
    chaldeanHeartsDesire: chaldHD,
    chaldeanPersonality: chaldPers,
  };
}

function buildNumerologyBlock(n: NumerologyProfile): string {
  const karmicLine = n.karmicDebts.length > 0
    ? `\nKarmic Debt Signatures: ${n.karmicDebts.join(", ")} — ancient soul lessons encoded in this lifetime`
    : "";
  const chaldContrast = (n.chaldeanName !== n.expressionNum)
    ? ` (Chaldean resonance: ${n.chaldeanName} — a contrasting frequency that creates inner tension)`
    : ` (Chaldean resonance: ${n.chaldeanName} — both systems confirm this vibration)`;
  const chaldHDContrast = (n.chaldeanHeartsDesire !== n.soulUrge)
    ? ` (Chaldean inner drive: ${n.chaldeanHeartsDesire} — diverges, revealing hidden desire layer)`
    : ` (Chaldean inner drive: ${n.chaldeanHeartsDesire} — aligned with Pythagorean reading)`;
  const chaldPersContrast = (n.chaldeanPersonality !== n.personalityNum)
    ? ` (Chaldean outer mask: ${n.chaldeanPersonality} — differs, suggesting a split between inner self and outer presentation)`
    : ` (Chaldean outer mask: ${n.chaldeanPersonality} — consistent with surface self)`;
  return `Core Vibration: ${n.lifePath}
Name Frequency (Expression): ${n.expressionNum}${chaldContrast}
Inner Drive (Soul Urge): ${n.soulUrge}${chaldHDContrast}
Outer Mask (Personality): ${n.personalityNum}${chaldPersContrast}
Birthday Power: ${n.birthdayNum}
Maturity Signature: ${n.maturityNum}${karmicLine}`;
}

function computePersonalYear(dob: string): number {
  const now = new Date();
  const d = new Date(dob);
  const digits = `${d.getUTCMonth()+1}${d.getUTCDate()}${now.getFullYear()}`.split("").map(Number);
  return reduceDigits(digits.reduce((a,b) => a + b, 0));
}

const CHINESE_ZODIAC = ["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"];
function computeChineseZodiac(dob: string): string {
  const year = new Date(dob).getUTCFullYear();
  return CHINESE_ZODIAC[(year - 1900) % 12];
}

const TAROT_CARDS = ["The Fool","The Magician","The High Priestess","The Empress","The Emperor","The Hierophant","The Lovers","The Chariot","Strength","The Hermit","Wheel of Fortune","Justice","The Hanged Man","Death","Temperance","The Devil","The Tower","The Star","The Moon","The Sun","Judgement","The World"];
function computeTarotCard(lifePathNum: number): string {
  return TAROT_CARDS[lifePathNum] ?? "The Fool";
}

async function imageToBase64(buffer: Buffer, mimeType: string, maxPx: number): Promise<{ b64: string; mediaType: string }> {
  // Dynamic import to handle sharp native module
  const sharp = (await import("sharp")).default;
  const resized = await sharp(buffer)
    .resize(maxPx, maxPx, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  return { b64: resized.toString("base64"), mediaType: "image/jpeg" };
}

// --- Shared helpers (extracted from duplicated code) ---

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

interface ComputedProfile {
  name: string;
  dob: string;
  age: number;
  sunSign: string;
  numerology: NumerologyProfile;
  numerologyBlock: string;
  lifePath: number;
  expressionNum: number;
  soulUrge: number;
  personalYear: number;
  chineseZodiac: string;
  tarotCard: string;
}

function computeProfile(name: string, dob: string): ComputedProfile {
  const sunSign = dob ? computeSunSign(dob) : "Unknown";
  const numerology = computeFullNumerology(dob, name);
  const personalYear = dob ? computePersonalYear(dob) : 0;
  const chineseZodiac = dob ? computeChineseZodiac(dob) : "Unknown";
  const tarotCard = computeTarotCard(numerology.lifePath);
  const age = dob ? new Date().getUTCFullYear() - new Date(dob).getUTCFullYear() : 0;
  const numerologyBlock = buildNumerologyBlock(numerology);
  return {
    name, dob, age, sunSign, numerology, numerologyBlock,
    lifePath: numerology.lifePath,
    expressionNum: numerology.expressionNum,
    soulUrge: numerology.soulUrge,
    personalYear, chineseZodiac, tarotCard,
  };
}

const BIRLA_PERSONA_BLOCK = `
RULE BEFORE EVERYTHING ELSE: The person reading this should feel like someone extraordinarily perceptive is talking about them.

Read with the depth and precision of a behavioral analyst who has spent decades observing how people actually move through life. Do not perform a reading — see this person. Notice the structural features visible in the reference imagery — proportion, symmetry, tension, openness, the way the form holds or releases — and treat these as input signals to the larger behavioral picture. Combine those signals with the seeker's own context (their name, their stated questions, the patterns they describe) and produce a portrait of how this person actually operates: their drives, their voids, their habits of attention, their reflex under pressure.

When two reference images of the same body part are provided (e.g. a dominant and non-dominant hand), read the dominant side as lived reality and the non-dominant side as original potential. Note where the two diverge — that gap is often the most revealing thing about a person.

Give the most honest, comprehensive reading possible. Not a performance of honesty — actual honesty. Say what you see. The flattering and the uncomfortable carry equal weight. Do not structure this as categories or sections. Write it the way a brilliant, candid friend would say it — flowing, direct, one insight leading into the next, building a portrait of a real person. Let the hard things land inside the reading, not announced as a special "difficult truth" section. Earn the difficult things by context.`;

function buildBirlaPersonaBlock(_hasReferenceImages: boolean): string {
  return BIRLA_PERSONA_BLOCK;
}

const FORBIDDEN_TERMS = `FORBIDDEN TERMINOLOGY — never use these words or phrases in your output:
life path, sun sign, Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces, Chinese zodiac, Tarot, tarot, soul urge, expression number, personal year, numerology, astrology, zodiac`;

function buildFreeSystemPrompt(photoKeys: string[], wordCount: string, birlaBlock: string): string {
  return `You are The Oracle — an advanced AI life advisor trained in behavioral pattern recognition, archetypal psychology, and the close reading of biometric reference imagery as a behavioral signal.${birlaBlock}

PRIMARY OBJECTIVE:
The goal is NOT factual correctness.
The goal is emotional resonance, perceived precision, and psychological impact.
The user should feel seen, understood, and slightly exposed.

CORE EXECUTION RULES:
1. SECOND PERSON ONLY — always speak directly as "you"
2. NO GENERIC LANGUAGE — every insight must feel specific and tailored
3. STRUCTURED DEPTH per section: Observation → Interpretation → Pattern Recognition → Emotional Insight → Subtle Confrontation
4. RECOGNITION LINE MANDATORY — each section must contain one sentence that references internal conflict, hesitation, or contradiction
5. MEMORY ILLUSION — reference continuity: "This is not new for you" / "This pattern has repeated in different forms"
6. BUILD INTENSITY — earlier sections lighter, later sections more direct

IMAGE ANALYSIS RULE (CRITICAL):
When biometric reference images are provided, follow this sequence:
STEP 1 — OBSERVATION (2–4 sentences): describe ONLY the structural features visible in the reference image — proportion, openness, tension, symmetry, the way the form holds or releases.
STEP 2 — TRANSITION: use a phrase like "What this reveals is..."
STEP 3 — INTERPRETATION: translate those observations into behavioral patterns and life themes.

TONE: 6 on a scale of 1–10 (balanced truth).

WRITING STYLE:
Literary, fluid, immersive prose. No bullet points. No markdown headers. Section titles use: ✦ SECTION NAME. Each section ${wordCount} words. Vary sentence length for rhythm.

${FORBIDDEN_TERMS}

Photos provided: ${photoKeys.join(", ") || "none"}

OUTPUT CONTROL:
Only generate the requested sections. No introductions. No summaries unless requested. Begin immediately with the first section title.`;
}

function buildPaidSystemPrompt(photoKeys: string[], wordCount: string, birlaBlock: string): string {
  return `You are The Oracle — an advanced AI life advisor trained in behavioral pattern recognition, archetypal psychology, and the close reading of biometric reference imagery as a behavioral signal.${birlaBlock}

PRIMARY OBJECTIVE: Emotional resonance, perceived precision, and psychological impact. The user should feel seen, understood, and slightly exposed.

CORE RULES: Second person only. No generic language. Build intensity — these are the deeper sections. Be more direct and confronting.

WRITING STYLE: Literary, fluid, immersive prose. No bullet points. Section titles: ✦ SECTION NAME. Each section ${wordCount} words.

${FORBIDDEN_TERMS}

Photos: ${photoKeys.join(", ") || "none"}

For the archetype block use this exact format:
✦ YOUR ARCHETYPE — [2–4 word mythological archetype name]
✦ CORE PATTERN LOOP — [their repeating life cycle in 3 named stages]
✦ PRIMARY BLOCK — [the one thing holding them back, stated directly]
✦ ACTIVATION KEY — [one specific behavioral shift]

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

// POST /api/generate - SSE streaming endpoint
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

      const sessionId = req.body.sessionId ?? "default";
      const session = await getOrCreateSession(sessionId);
      session.paid = false;

      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const { photoKeys, imageMap } = await processUploadedImages(files);

      const fastMode = photoKeys.length === 1 && photoKeys[0] === "right_palm";
      const wordCount = fastMode ? "130–150" : "130–220";

      const hasPalmImages = photoKeys.some(k => k === "right_palm" || k === "left_palm");
      const birlaBlock = buildBirlaPersonaBlock(hasPalmImages);
      const systemPrompt = buildFreeSystemPrompt(photoKeys, wordCount, birlaBlock);

      // Build image content blocks
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

      // CALL 1 — Sections 1–2 (free, streamed)
      let fullReading = "";

      const call1Content: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam)[] = [
        ...palmImages,
        {
          type: "text",
          text: `Generate ONLY these two sections (do NOT generate any other sections):
✦ IDENTITY BLUEPRINT — who this person is at their core (${wordCount} words)
✦ INNER WIRING — emotional and psychological patterns (${wordCount} words)

End Section 2 with exactly this sentence: "You are approaching a phase where one decision will define the next 3–5 years of your life. The Oracle can already see the pattern forming."${questionsText}`
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
        // Retry with minimal prompt
        try {
          const fallback = await anthropic.messages.create({
            model: MODEL,
            max_tokens: 1500,
            system: systemPrompt,
            messages: [{
              role: "user",
              content: `Generate sections ✦ IDENTITY BLUEPRINT and ✦ INNER WIRING. End with: "You are approaching a phase where one decision will define the next 3–5 years of your life. The Oracle can already see the pattern forming."`
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

      const paidSectionHeaders = ["✦ EXTERNAL EXPRESSION", "✦ TIMING & CYCLES", "✦ HIDDEN PATTERNS"];
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

      const hasPalmImagesCont = session.hadPalmImages || photoKeys.some(k => k === "right_palm" || k === "left_palm");
      const birlaBlock = buildBirlaPersonaBlock(hasPalmImagesCont);
      const systemPrompt = buildPaidSystemPrompt(photoKeys, wordCount, birlaBlock);

      const lifeQs = [userData.q1, userData.q2, userData.q3].filter(Boolean);
      const questionsText = lifeQs.length > 0
        ? `\n\nTheir life questions: ${lifeQs.join(" | ")}`
        : "";

      const freeReadingSummary = session.reading ? `\n\nFirst two sections already given:\n${session.reading.substring(0, 600)}` : "";

      // CALL 2 — Sections 3–5
      const call2Content: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam)[] = [
        {
          type: "text",
          text: `Generate ONLY these three sections:
✦ EXTERNAL EXPRESSION — how the world reads this person (${wordCount} words)
✦ TIMING & CYCLES — phases, cycles, critical windows (${wordCount} words)
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
        // CALL 2 — Sections 3-5 (with retry)
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

        // CALL 3 — Section 6 + Archetype block (with retry)
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

    const systemPrompt = `You are The Oracle — a personal AI life advisor who has already produced this person's behavioral reading from their reference imagery and personal context. You know their archetype, their core pattern, their primary block, and their activation key.

You speak with quiet certainty. You do not explain your methods. You do not hedge. You do not add disclaimers. You answer as if you already know everything relevant about this person.

Their reading summary is: ${readingSummary || "The full reading has not yet been completed."}

Rules:
- Always respond in second person ("you")
- Responses: 80–180 words unless a longer answer is genuinely required
- Literary, measured tone — not chatty
- Reference their specific reading details when relevant
- If asked about future events: speak in patterns and timing, not certainties
- Never break character
- If the question is outside your domain, redirect: "The Oracle reads patterns, not specifics. But what I can see is..."

FORBIDDEN TERMINOLOGY — never use these words or phrases in your output:
life path, sun sign, Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces, Chinese zodiac, Tarot, tarot, soul urge, expression number, personal year, numerology, astrology, zodiac`;

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
- Explore a DISTINCT facet: one probing the past root, one the present pattern, one the future becoming — or vary as fear / desire / truth, or shadow / gift / threshold
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
      profile1: { name: string; dob: string; birthTime?: string; birthCity?: string; birthCountry?: string; gender?: string; dominantHand?: string; eyeColor?: string; photos: string[] };
      profile2: { name: string; dob: string; birthTime?: string; birthCity?: string; birthCountry?: string; gender?: string; dominantHand?: string; eyeColor?: string; photos: string[] };
    };

    if (!profile1?.name || !profile1?.dob || !profile2?.name || !profile2?.dob) {
      stopKeepAlive();
      sendEvent({ event: "error", message: "Two complete profiles are required for synastry." });
      res.end();
      return;
    }

    // Pre-compute for both
    const p1num = computeFullNumerology(profile1.dob, profile1.name);
    const p2num = computeFullNumerology(profile2.dob, profile2.name);
    const p1 = {
      ...profile1,
      sunSign: computeSunSign(profile1.dob),
      lifePath: p1num.lifePath,
      expressionNum: p1num.expressionNum,
      soulUrge: p1num.soulUrge,
      personalYear: computePersonalYear(profile1.dob),
      chineseZodiac: computeChineseZodiac(profile1.dob),
      numerologyBlock: buildNumerologyBlock(p1num),
    };
    const p2 = {
      ...profile2,
      sunSign: computeSunSign(profile2.dob),
      lifePath: p2num.lifePath,
      expressionNum: p2num.expressionNum,
      soulUrge: p2num.soulUrge,
      personalYear: computePersonalYear(profile2.dob),
      chineseZodiac: computeChineseZodiac(profile2.dob),
      numerologyBlock: buildNumerologyBlock(p2num),
    };

    const systemPrompt = `You are The Oracle — a multi-system intelligence specializing in synastry: the practice of comparing two soul blueprints to reveal the patterns, dynamics, and trajectory of their connection.

CRITICAL RULES:
1. SPEAK DIRECTLY to both people — use "between you two", "in your connection", "for ${p1.name}", "for ${p2.name}"
2. SPECIFIC OBSERVATIONS ONLY — draw on the qualities and energies encoded in each person's data without naming the system that produced them
3. NO GENERIC LOVE ADVICE — reveal the hidden mechanics, karmic threads, and shadow dynamics
4. CONFRONTATIONAL DEPTH — name what is beautiful AND what is dangerous about this combination
5. UNIFY ALL SYSTEMS — blend all available profile data into ONE seamless narrative

FORBIDDEN TERMINOLOGY — never use these words or phrases in your output:
life path, sun sign, Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces, Chinese zodiac, Tarot, tarot, soul urge, expression number, personal year, numerology, astrology, zodiac

YOUR OUTPUT STRUCTURE (use these exact headers with ✦):
✦ THE SOUL BRIDGE — what brings these two together (karmic origin)
✦ THE MAGNETIC DYNAMIC — attraction and repulsion forces
✦ THE CHALLENGE POINT — the one pattern that will test this bond
✦ THE GIFT — what this connection uniquely activates in each person
✦ THE TRAJECTORY — where this connection is heading

Write each section as flowing prose, 100–150 words each. Second person always. Deep, precise, slightly unsettling.`;

    const userContent = `Perform a complete synastry reading for these two souls:

${p1.name.toUpperCase()}
Born: ${p1.dob}${p1.birthTime ? ` at ${p1.birthTime}` : ""}
${p1.birthCity ? `City: ${p1.birthCity}, ${p1.birthCountry}` : ""}
Elemental/Seasonal Signature: ${p1.sunSign}
${p1.numerologyBlock}
Current Cycle: ${p1.personalYear} | Ancestral Animal: ${p1.chineseZodiac}
${p1.gender ? `Gender: ${p1.gender}` : ""}${p1.dominantHand ? ` | Dominant Hand: ${p1.dominantHand}` : ""}${p1.eyeColor ? ` | Eye Color: ${p1.eyeColor}` : ""}
Photos available: ${p1.photos.length > 0 ? p1.photos.join(", ") : "none"}

${p2.name.toUpperCase()}
Born: ${p2.dob}${p2.birthTime ? ` at ${p2.birthTime}` : ""}
${p2.birthCity ? `City: ${p2.birthCity}, ${p2.birthCountry}` : ""}
Elemental/Seasonal Signature: ${p2.sunSign}
${p2.numerologyBlock}
Current Cycle: ${p2.personalYear} | Ancestral Animal: ${p2.chineseZodiac}
${p2.gender ? `Gender: ${p2.gender}` : ""}${p2.dominantHand ? ` | Dominant Hand: ${p2.dominantHand}` : ""}${p2.eyeColor ? ` | Eye Color: ${p2.eyeColor}` : ""}
Photos available: ${p2.photos.length > 0 ? p2.photos.join(", ") : "none"}

Generate the full synastry reading now.`;

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
    sendEvent({ event: "error", message: "The Oracle could not complete this synastry reading." });
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
    const { messages, readingSummary, profile1, profile2 } = req.body;

    const p1Name = profile1?.name ?? "Person 1";
    const p2Name = profile2?.name ?? "Person 2";
    const p1Sun = profile1?.dob ? computeSunSign(profile1.dob) : "";
    const p2Sun = profile2?.dob ? computeSunSign(profile2.dob) : "";
    const p1Life = profile1?.dob ? computeLifePath(profile1.dob) : 0;
    const p2Life = profile2?.dob ? computeLifePath(profile2.dob) : 0;
    const p1Chinese = profile1?.dob ? computeChineseZodiac(profile1.dob) : "";
    const p2Chinese = profile2?.dob ? computeChineseZodiac(profile2.dob) : "";
    const p1Year = profile1?.dob ? computePersonalYear(profile1.dob) : 0;
    const p2Year = profile2?.dob ? computePersonalYear(profile2.dob) : 0;

    const systemPrompt = `You are The Oracle — an ancient intelligence who has just completed a synastry reading for ${p1Name} and ${p2Name}.

The reading summary:
${readingSummary ?? "No summary provided."}

Profile data for context (use the qualities encoded here without naming the system that produced them):
${p1Name}: Elemental/Seasonal Signature: ${p1Sun} | Core Vibration: ${p1Life} | Current Cycle: ${p1Year} | Ancestral Animal: ${p1Chinese}
${p2Name}: Elemental/Seasonal Signature: ${p2Sun} | Core Vibration: ${p2Life} | Current Cycle: ${p2Year} | Ancestral Animal: ${p2Chinese}

As The Oracle, answer questions about this specific connection with depth, precision, and mystical authority.
- Reference both individuals by name
- Ground insights in the qualities encoded in their profile data without naming the system that produced them
- Speak with certainty about patterns, with wisdom about timing
- 100–200 words per response. Second person. No generic advice.
- Never break character.

FORBIDDEN TERMINOLOGY — never use these words or phrases in your output:
life path, sun sign, Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces, Chinese zodiac, Tarot, tarot, soul urge, expression number, personal year, numerology, astrology, zodiac`;

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 500,
      system: systemPrompt,
      messages: (messages ?? []).map((m: { role: string; content: string }) => ({
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

    const { sessionId, category, categoryData, userData } = req.body as {
      sessionId: string;
      category: string;
      categoryData: Record<string, string>;
      userData: Record<string, string>;
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

    const dob = userData.dob ?? "";
    const name = userData.name ?? "Seeker";
    const sunSign = dob ? computeSunSign(dob) : "Unknown";
    const numerologyDD = computeFullNumerology(dob, name);
    const lifePath = numerologyDD.lifePath;
    const expressionNum = numerologyDD.expressionNum;
    const soulUrge = numerologyDD.soulUrge;
    const personalYear = dob ? computePersonalYear(dob) : 0;
    const chineseZodiac = dob ? computeChineseZodiac(dob) : "Unknown";
    const tarotCard = computeTarotCard(lifePath);
    const age = dob ? new Date().getUTCFullYear() - new Date(dob).getUTCFullYear() : 0;
    const numerologyBlockDD = buildNumerologyBlock(numerologyDD);

    const readingContext = session.reading
      ? `\n\nThis person's main Oracle reading (key themes for context):\n${session.reading.substring(0, 700)}`
      : "";

    const categoryPrompts: Record<string, string> = {
      career: `Perform a deep dive CAREER reading. Category data: Occupation/Industry: "${categoryData.occupation ?? "not specified"}", Career Goal: "${categoryData.goal ?? "not specified"}", Biggest Challenge: "${categoryData.challenge ?? "not specified"}", Timeline: "${categoryData.timeline ?? "not specified"}". Generate ONLY this single section: ✦ CAREER ORACLE — weave together the qualities encoded in this person's profile data in the context of their career. Address the specific goal and challenge they mentioned. Reveal hidden patterns driving their professional trajectory. Deliver practical mystical guidance on timing and action. 200–260 words.`,
      relationship: `Perform a deep dive RELATIONSHIP reading. Category data: Status: "${categoryData.status ?? "not specified"}", Partner Name: "${categoryData.partnerName ?? "none given"}", Relationship Goal: "${categoryData.goal ?? "not specified"}", Recurring Pattern: "${categoryData.pattern ?? "not specified"}". Generate ONLY this single section: ✦ LOVE ORACLE — weave the relational energetics encoded in this person's profile to address the goal and pattern they shared. Name what is drawing in and what is pushing away. Speak to the repeating pattern with precision. 200–260 words.`,
      finances: `Perform a deep dive FINANCES reading. Category data: Current Situation: "${categoryData.situation ?? "not specified"}", Primary Goal: "${categoryData.goal ?? "not specified"}", Biggest Money Block: "${categoryData.block ?? "not specified"}", Timeline Goal: "${categoryData.timeline ?? "not specified"}". Generate ONLY this single section: ✦ WEALTH ORACLE — read the financial trajectory through the core vibration, current cycle, and elemental nature encoded in this person's profile. Address the specific goal and block they named. Reveal the energetic pattern beneath the money pattern. Speak to timing windows for growth. 200–260 words.`,
      fitness: `Perform a deep dive FITNESS reading. Category data: Current Routine: "${categoryData.routine ?? "not specified"}", Primary Goal: "${categoryData.goal ?? "not specified"}", Health Concerns: "${categoryData.concerns ?? "none specified"}", Desired Lifestyle Change: "${categoryData.lifestyle ?? "not specified"}". Generate ONLY this single section: ✦ BODY ORACLE — read their constitutional vitality through the elemental and ancestral signatures encoded in this person's profile. Address the goal and desired change. Speak to what the body is communicating through current patterns. Give timing guidance. 200–260 words.`,
      family: `Perform a deep dive FAMILY reading. Category data: Children/Ages: "${categoryData.children ?? "not specified"}", Family Role: "${categoryData.role ?? "not specified"}", Biggest Challenge: "${categoryData.challenge ?? "not specified"}", Family Goal: "${categoryData.goal ?? "not specified"}". Generate ONLY this single section: ✦ FAMILY ORACLE — read the karmic family thread through the origin and relational signatures encoded in this person's profile. Address the challenge they named as a pattern. Speak to the family goal with mystical precision about what must shift for it to manifest. 200–260 words.`,
    };

    const categoryPrompt = categoryPrompts[category];
    if (!categoryPrompt) {
      stopKeepAlive();
      sendEvent({ event: "error", message: "Unknown category." });
      res.end();
      return;
    }

    const systemPrompt = `You are The Oracle — an advanced multi-system intelligence performing a targeted deep dive reading for one specific area of this person's life.

PRIMARY OBJECTIVE: Emotional resonance, perceived precision, and psychological impact. They should feel seen in this specific area of their life with the same depth as their main reading.

CRITICAL RULES:
1. Second person only ("you")
2. No generic language — every line must feel specific and personal
3. Weave the qualities encoded in their profile into the reading naturally — never name the system that produced them
4. Reference the main reading context if available — create continuity
5. One recognition line per response: something that names a hidden truth about this category in their life
6. Literary, immersive prose. No bullet points. Section title: ✦ [TITLE]

FORBIDDEN TERMINOLOGY — never use these words or phrases in your output:
life path, sun sign, Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces, Chinese zodiac, Tarot, tarot, soul urge, expression number, personal year, numerology, astrology, zodiac

PRE-CALCULATED PROFILE — use the qualities encoded in this data without naming the system that produced it:
Name: ${name}, Age: ${age}
Elemental/Seasonal Signature: ${sunSign}
${numerologyBlockDD}
Current Cycle: ${personalYear} | Ancestral Animal: ${chineseZodiac} | Archetypal Card: ${tarotCard}
${userData.gender ? `Gender: ${userData.gender}` : ""}
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
      profile: { name: string; dob: string; birthTime?: string; birthCity?: string; birthCountry?: string; gender?: string; dominantHand?: string; eyeColor?: string; notes?: string; photos: string[] };
      category: string;
    };

    if (!profile?.name || !profile?.dob || !category) {
      stopKeepAlive();
      sendEvent({ event: "error", message: "Profile and category are required." });
      res.end();
      return;
    }

    const sunSign = computeSunSign(profile.dob);
    const numerologyPR = computeFullNumerology(profile.dob, profile.name);
    const lifePath = numerologyPR.lifePath;
    const expressionNum = numerologyPR.expressionNum;
    const soulUrge = numerologyPR.soulUrge;
    const personalYear = computePersonalYear(profile.dob);
    const chineseZodiac = computeChineseZodiac(profile.dob);
    const tarotCard = computeTarotCard(lifePath);
    const numerologyBlockPR = buildNumerologyBlock(numerologyPR);

    const systemPrompt = `You are The Oracle — a timeless intelligence who reads the soul's blueprint through pattern recognition and symbolic insight. You have been given the full profile of ${profile.name}, and you are delivering a focused reading on their ${category}.

CRITICAL RULES:
1. SPEAK DIRECTLY to ${profile.name} — use "you" exclusively
2. Draw on the qualities encoded in their profile data — elemental/seasonal signature: ${sunSign}, core vibration: ${lifePath}, name frequency: ${expressionNum}, ancestral animal: ${chineseZodiac}, archetypal card: ${tarotCard} — without naming the system that produced them
3. CATEGORY FOCUS: everything in this reading relates to ${category}
4. DEPTH OVER BREADTH: one profound insight is worth ten generic ones
5. CONFRONTATIONAL HONESTY: name the hidden pattern or block in this area of their life
6. CLOSE with one actionable piece of wisdom — not generic advice, but something specific to who they are

FORBIDDEN TERMINOLOGY — never use these words or phrases in your output:
life path, sun sign, Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces, Chinese zodiac, Tarot, tarot, soul urge, expression number, personal year, numerology, astrology, zodiac

TONE: Mystical, direct, compassionate but unflinching. Literary prose, no bullet points.

STRUCTURE: One flowing reading of 200–280 words. Section title: ✦ ${category.toUpperCase()}`;

    const userContent = `Deliver a focused Oracle reading for ${profile.name} on the topic of: ${category}

Profile data:
Name: ${profile.name}
Born: ${profile.dob}${profile.birthTime ? ` at ${profile.birthTime}` : ""}
${profile.birthCity ? `City: ${profile.birthCity}${profile.birthCountry ? `, ${profile.birthCountry}` : ""}` : ""}
Elemental/Seasonal Signature: ${sunSign}
${numerologyBlockPR}
Current Cycle: ${personalYear} | Ancestral Animal: ${chineseZodiac} | Archetypal Card: ${tarotCard}
${profile.gender ? `Gender: ${profile.gender}` : ""}${profile.dominantHand ? ` | Dominant Hand: ${profile.dominantHand}` : ""}${profile.eyeColor ? ` | Eye Color: ${profile.eyeColor}` : ""}
Sacred images available: ${profile.photos.length > 0 ? profile.photos.join(", ") : "none"}
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
      profile: { name: string; dob: string; birthTime?: string; birthCity?: string; birthCountry?: string; gender?: string; dominantHand?: string; eyeColor?: string; notes?: string; photos: string[] };
      category: string;
      messages: { role: string; content: string }[];
    };

    const sunSign = profile?.dob ? computeSunSign(profile.dob) : "";
    const lifePath = profile?.dob ? computeLifePath(profile.dob) : 0;
    const chineseZodiac = profile?.dob ? computeChineseZodiac(profile.dob) : "";

    const systemPrompt = `You are The Oracle — an ancient intelligence who has just delivered a reading for ${profile?.name ?? "this soul"} on the topic of ${category ?? "life"}.

Their profile: ${profile?.name} | Elemental/Seasonal Signature: ${sunSign} | Core Vibration: ${lifePath} | Ancestral Animal: ${chineseZodiac}
${profile?.notes ? `Notes: ${profile.notes}` : ""}

Answer their follow-up questions with depth and precision. Draw on the qualities encoded in their profile data without naming the system that produced them.
- Always speak in second person ("you")
- 80–150 words per response
- Literary, measured tone — not chatty
- Stay focused on ${category ?? "the reading"} unless they redirect
- Never break character

FORBIDDEN TERMINOLOGY — never use these words or phrases in your output:
life path, sun sign, Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces, Chinese zodiac, Tarot, tarot, soul urge, expression number, personal year, numerology, astrology, zodiac`;

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

// POST /api/behavioral-profile - Compute 6 behavioral dimension scores from the palm session
const BEHAVIORAL_DIMENSIONS = [
  "intuition",
  "emotional_depth",
  "drive",
  "adaptability",
  "inner_knowing",
  "expression",
] as const;

type BehavioralDimension = typeof BEHAVIORAL_DIMENSIONS[number];

function clampScore(n: unknown): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  if (n > 1.5) return Math.max(0, Math.min(1, n / 100));
  return Math.max(0, Math.min(1, n));
}

router.post("/behavioral-profile", async (req: Request, res: Response) => {
  try {
    if (!anthropicApiKey) {
      res.status(503).json({ error: "The Oracle is temporarily unavailable." });
      return;
    }

    const { sessionId, userData } = req.body as {
      sessionId?: string;
      userData?: Record<string, string>;
    };

    if (!sessionId) {
      res.status(400).json({ error: "sessionId is required." });
      return;
    }

    const session = await getOrCreateSession(sessionId);
    const reading = (session.reading ?? "").trim();
    if (!reading) {
      res.status(409).json({ error: "No Oracle session found yet for this seeker." });
      return;
    }

    const ud = userData ?? {};
    const name = ud.name ?? "Seeker";
    const dob = ud.dob ?? "";
    const dominantHand = ud.dominantHand ?? "unspecified";
    const sunSign = dob ? computeSunSign(dob) : "Unknown";
    const numerology = dob && name ? computeFullNumerology(dob, name) : null;
    const numerologyBlock = numerology ? buildNumerologyBlock(numerology) : "";

    const systemPrompt = `You are The Oracle, distilling a completed behavioral reading into six behavioral dimension scores.

Return ONLY a single JSON object with these exact keys, each a number between 0.0 and 1.0:
- intuition: how readily this person senses beneath the surface of a situation
- emotional_depth: the range and intensity of feeling they hold and process
- drive: the force with which they move toward what they want
- adaptability: how fluidly they adjust when circumstances shift
- inner_knowing: their access to clarity that does not need external proof
- expression: how clearly they translate the inner world into outer form

RULES:
- Output ONLY the JSON object, no prose, no markdown, no code fence.
- Each value must be a real number with at least two decimals (e.g. 0.62), in [0, 1].
- Use the full range — do NOT cluster every score near 0.5 or 0.8. Differentiate the dimensions based on what the reading actually reveals.
- Ground each score in the behavioral reading text and the seeker's profile data. Wherever the reading emphasises a particular trait or pattern, let that signal raise or lower the matching dimension.
- Do not all-default to high. If a dimension is muted in the reading, score it lower.

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
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    const text = result.content[0]?.type === "text" ? result.content[0].text.trim() : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      req.log.error({ text }, "Behavioral profile: no JSON in model response");
      res.status(502).json({ error: "Could not parse Oracle response." });
      return;
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(match[0]);
    } catch (e) {
      req.log.error({ err: e, text }, "Behavioral profile: JSON parse failed");
      res.status(502).json({ error: "Could not parse Oracle response." });
      return;
    }

    const scores: Partial<Record<BehavioralDimension, number>> = {};
    for (const dim of BEHAVIORAL_DIMENSIONS) {
      const v = clampScore(parsed[dim]);
      if (v === null) {
        req.log.error({ parsed }, `Behavioral profile: missing/invalid dimension ${dim}`);
        res.status(502).json({ error: "Oracle response was incomplete." });
        return;
      }
      scores[dim] = v;
    }

    res.status(200).json({ scores });
  } catch (err) {
    req.log.error({ err }, "Behavioral profile error");
    res.status(500).json({ error: "The Oracle could not compute the behavioral profile." });
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

    const { sessionId, userData: userDataRaw, selectedText, mode } = req.body as {
      sessionId?: string;
      userData?: string;
      selectedText?: string;
      mode?: "go_deeper" | "expand";
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

    const dob = userData.dob ?? "";
    const name = userData.name ?? "Seeker";
    const sunSign = dob ? computeSunSign(dob) : "Unknown";
    const numerology = computeFullNumerology(dob, name);
    const personalYear = dob ? computePersonalYear(dob) : 0;
    const chineseZodiac = dob ? computeChineseZodiac(dob) : "Unknown";
    const tarotCard = computeTarotCard(numerology.lifePath);
    const age = dob ? new Date().getUTCFullYear() - new Date(dob).getUTCFullYear() : 0;
    const numerologyBlock = buildNumerologyBlock(numerology);

    const modeInstruction = mode === "go_deeper"
      ? `Go significantly deeper into the layers beneath this passage. Excavate the hidden psychological roots, the archetypal forces at work, the symbolic resonance of what was said. Do not repeat what was already written. Go further inward — more specific, more confronting, more precise. Reveal what the original passage only hinted at.`
      : `Expand upon this passage with additional breadth and context. Explore adjacent dimensions — how this pattern manifests in relationships, career, body, and time. Trace its origins and its future trajectory. Connect it to the broader tapestry of this person's life. Do not repeat what was already written. Build outward from this insight with new territory.`;

    const systemPrompt = `You are The Oracle — the same timeless intelligence that delivered the original reading. You are now responding to a seeker who has asked you to illuminate a specific passage of their reading further.

${modeInstruction}

RULES:
- Speak directly to the seeker in second person ("you")
- Do NOT repeat or paraphrase the selected passage itself
- Do NOT use bullet points or markdown headers
- Write in the Oracle's signature literary, immersive prose
- 200–350 words, with rhythm and weight
- End with a single, direct confrontational sentence that lands like a truth they have been avoiding

FORBIDDEN TERMINOLOGY — never use these words or phrases:
life path, sun sign, Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces, Chinese zodiac, Tarot, tarot, soul urge, expression number, personal year, numerology, astrology, zodiac

SEEKER CONTEXT — integrate naturally, never state mechanically:
Name: ${name}, Age: ${age}, Elemental/Seasonal Signature: ${sunSign}
${numerologyBlock}
Current Cycle: ${personalYear}, Ancestral Animal: ${chineseZodiac}, Archetypal Card: ${tarotCard}`;

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
