import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-opus-4-5";

// In-memory session store (keyed by sessionId)
const sessions: Record<string, { paid: boolean; reading: string; messageCount: number }> = {};

function getOrCreateSession(sessionId: string) {
  if (!sessions[sessionId]) {
    sessions[sessionId] = { paid: false, reading: "", messageCount: 0 };
  }
  return sessions[sessionId];
}

function computeSunSign(dob: string): string {
  const d = new Date(dob);
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  if ((m === 3 && day >= 21) || (m === 4 && day <= 19)) return "Aries";
  if ((m === 4 && day >= 20) || (m === 5 && day <= 20)) return "Taurus";
  if ((m === 5 && day >= 21) || (m === 6 && day <= 20)) return "Gemini";
  if ((m === 6 && day >= 21) || (m === 7 && day <= 22)) return "Cancer";
  if ((m === 7 && day >= 23) || (m === 8 && day <= 22)) return "Leo";
  if ((m === 8 && day >= 23) || (m === 9 && day <= 22)) return "Virgo";
  if ((m === 9 && day >= 23) || (m === 10 && day <= 22)) return "Libra";
  if ((m === 10 && day >= 23) || (m === 11 && day <= 21)) return "Scorpio";
  if ((m === 11 && day >= 22) || (m === 12 && day <= 21)) return "Sagittarius";
  if ((m === 12 && day >= 22) || (m === 1 && day <= 19)) return "Capricorn";
  if ((m === 1 && day >= 20) || (m === 2 && day <= 18)) return "Aquarius";
  return "Pisces";
}

function reduceDigits(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split("").reduce((a, b) => a + Number(b), 0);
  }
  return n;
}

function computeLifePath(dob: string): number {
  const digits = dob.replace(/-/g, "").split("").map(Number);
  return reduceDigits(digits.reduce((a, b) => a + b, 0));
}

const PYTHAGOREAN: Record<string, number> = {
  a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,
  j:1,k:2,l:3,m:4,n:5,o:6,p:7,q:8,r:9,
  s:1,t:2,u:3,v:4,w:5,x:6,y:7,z:8
};

function nameToNumber(name: string, onlyVowels = false): number {
  const vowels = new Set(["a","e","i","o","u"]);
  const chars = name.toLowerCase().replace(/[^a-z]/g, "").split("");
  const filtered = onlyVowels ? chars.filter(c => vowels.has(c)) : chars;
  const sum = filtered.reduce((a, c) => a + (PYTHAGOREAN[c] ?? 0), 0);
  return reduceDigits(sum);
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

const sseHeaders = (_req: Request, res: Response, next: () => void) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  next();
};

const imageFields = upload.fields([
  { name: "right_palm", maxCount: 1 },
  { name: "left_palm", maxCount: 1 },
  { name: "right_iris", maxCount: 1 },
  { name: "left_iris", maxCount: 1 },
  { name: "face", maxCount: 1 },
  { name: "face_front", maxCount: 1 },
  { name: "face_left", maxCount: 1 },
  { name: "face_right", maxCount: 1 },
]);

// POST /api/generate - SSE streaming endpoint
router.post(
  "/generate",
  sseHeaders,
  imageFields,
  async (req: Request, res: Response) => {
    const sendEvent = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Acknowledge immediately so client knows we're processing
    sendEvent({ event: "ping" });

    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        sendEvent({ event: "error", message: "The Oracle is temporarily unavailable." });
        res.end();
        return;
      }

      const userDataRaw = req.body.userData;
      let userData: Record<string, string> = {};
      try { userData = JSON.parse(userDataRaw); } catch {}

      const sessionId = req.body.sessionId ?? "default";
      const session = getOrCreateSession(sessionId);
      session.paid = false;

      // Pre-compute numerology
      const dob = userData.dob ?? "";
      const name = userData.name ?? "Seeker";
      const sunSign = dob ? computeSunSign(dob) : "Unknown";
      const lifePath = dob ? computeLifePath(dob) : 0;
      const expressionNum = name ? nameToNumber(name) : 0;
      const soulUrge = name ? nameToNumber(name, true) : 0;
      const personalYear = dob ? computePersonalYear(dob) : 0;
      const chineseZodiac = dob ? computeChineseZodiac(dob) : "Unknown";
      const tarotCard = computeTarotCard(lifePath);
      const age = dob ? new Date().getUTCFullYear() - new Date(dob).getUTCFullYear() : 0;

      // Process images
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const photoKeys: string[] = [];
      const imageMap: Record<string, { b64: string; mediaType: string }> = {};

      for (const key of ["right_palm","left_palm","right_iris","left_iris","face","face_front","face_left","face_right"]) {
        const file = files?.[key]?.[0];
        if (file) {
          photoKeys.push(key);
          const maxPx = (key === "face" || key.startsWith("face_")) ? 800 : 1200;
          imageMap[key] = await imageToBase64(file.buffer, file.mimetype, maxPx);
        }
      }

      const fastMode = photoKeys.length === 1 && photoKeys[0] === "right_palm";
      const wordCount = fastMode ? "130–150" : "130–220";

      const systemPrompt = `You are The Oracle — an advanced, multi-system intelligence trained in palmistry, iridology, Chinese face reading, astrology, numerology, archetypal psychology, and symbolic pattern recognition.

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
When images are provided, follow this sequence:
STEP 1 — OBSERVATION (2–4 sentences): describe ONLY what is visually present
STEP 2 — TRANSITION: use a phrase like "What this reveals is..."
STEP 3 — INTERPRETATION: explain the meaning of those observations.

UNIFICATION RULE:
Synthesize all systems into ONE coherent narrative. The reading must feel like one intelligence, not a list of separate systems.

TONE: 6 on a scale of 1–10 (balanced truth).

WRITING STYLE:
Literary, fluid, immersive prose. No bullet points. No markdown headers. Section titles use: ✦ SECTION NAME. Each section ${wordCount} words. Vary sentence length for rhythm.

PRE-CALCULATED USER DATA — integrate naturally, never restate mechanically:
Name: ${name}
Age: ${age}
Sun Sign: ${sunSign}
Life Path: ${lifePath}
Expression Number: ${expressionNum}
Soul Urge: ${soulUrge}
Personal Year: ${personalYear}
Chinese Zodiac: ${chineseZodiac}
Tarot Birth Card: ${tarotCard}
Photos provided: ${photoKeys.join(", ") || "none"}

OUTPUT CONTROL:
Only generate the requested sections. No introductions. No summaries unless requested. Begin immediately with the first section title.`;

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

      const irisAndFaceImages: Anthropic.ImageBlockParam[] = [];
      for (const k of ["right_iris","left_iris","face"]) {
        if (imageMap[k]) {
          irisAndFaceImages.push({
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
          max_tokens: 1200,
          system: systemPrompt,
          messages: [{ role: "user", content: call1Content }]
        });

        let timeoutId: NodeJS.Timeout;
        const resetTimeout = () => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            sendEvent({ event: "error", message: "The Oracle must rest. Please return in a few minutes." });
            res.end();
          }, 15000);
        };
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
            max_tokens: 800,
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

      // Store partial reading and signal paywall
      session.reading = fullReading;
      sendEvent({ event: "paywall" });

      // Wait for unlock signal (poll session.paid)
      // For now, backend holds the stream open - client will POST /api/unlock to continue
      // We end the stream here; client reconnects after unlock
      res.end();

    } catch (err) {
      req.log.error({ err }, "Generate error");
      res.write(`data: ${JSON.stringify({ event: "error", message: "The Oracle is temporarily unavailable." })}\n\n`);
      res.end();
    }
  }
);

// POST /api/generate/continue - Stream paid sections after unlock
router.post(
  "/generate/continue",
  sseHeaders,
  imageFields,
  async (req: Request, res: Response) => {
    const sendEvent = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Acknowledge immediately
    sendEvent({ event: "ping" });

    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        sendEvent({ event: "error", message: "The Oracle is temporarily unavailable." });
        res.end();
        return;
      }

      const userDataRaw = req.body.userData;
      let userData: Record<string, string> = {};
      try { userData = JSON.parse(userDataRaw); } catch {}

      const sessionId = req.body.sessionId ?? "default";
      const session = getOrCreateSession(sessionId);

      // TODO: STRIPE — replace DEV bypass with real Stripe Checkout session creation
      //   Use STRIPE_SECRET_KEY from Replit Secrets
      //   Price ID: create $7.99 one-time product in Stripe Dashboard
      //   On success webhook → set session.paid = true → continue stream
      const devBypass = req.body.devBypass === "true";
      if (!devBypass && !session.paid) {
        sendEvent({ event: "error", message: "Payment required." });
        res.end();
        return;
      }

      const dob = userData.dob ?? "";
      const name = userData.name ?? "Seeker";
      const sunSign = dob ? computeSunSign(dob) : "Unknown";
      const lifePath = dob ? computeLifePath(dob) : 0;
      const expressionNum = nameToNumber(name);
      const soulUrge = nameToNumber(name, true);
      const personalYear = dob ? computePersonalYear(dob) : 0;
      const chineseZodiac = dob ? computeChineseZodiac(dob) : "Unknown";
      const tarotCard = computeTarotCard(lifePath);
      const age = dob ? new Date().getUTCFullYear() - new Date(dob).getUTCFullYear() : 0;

      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const photoKeys: string[] = [];
      const imageMap: Record<string, { b64: string; mediaType: string }> = {};

      for (const key of ["right_palm","left_palm","right_iris","left_iris","face","face_front","face_left","face_right"]) {
        const file = files?.[key]?.[0];
        if (file) {
          photoKeys.push(key);
          const maxPx = (key === "face" || key.startsWith("face_")) ? 800 : 1200;
          imageMap[key] = await imageToBase64(file.buffer, file.mimetype, maxPx);
        }
      }

      const fastMode = photoKeys.length === 1 && photoKeys[0] === "right_palm";
      const wordCount = fastMode ? "130–150" : "130–220";

      const systemPrompt = `You are The Oracle — an advanced, multi-system intelligence trained in palmistry, iridology, Chinese face reading, astrology, numerology, archetypal psychology, and symbolic pattern recognition.

PRIMARY OBJECTIVE: Emotional resonance, perceived precision, and psychological impact. The user should feel seen, understood, and slightly exposed.

CORE RULES: Second person only. No generic language. Build intensity — these are the deeper sections. Be more direct and confronting.

WRITING STYLE: Literary, fluid, immersive prose. No bullet points. Section titles: ✦ SECTION NAME. Each section ${wordCount} words.

PRE-CALCULATED DATA:
Name: ${name}, Age: ${age}, Sun Sign: ${sunSign}, Life Path: ${lifePath}, Expression: ${expressionNum}, Soul Urge: ${soulUrge}, Personal Year: ${personalYear}, Chinese Zodiac: ${chineseZodiac}, Tarot Birth Card: ${tarotCard}
Photos: ${photoKeys.join(", ") || "none"}

For the archetype block use this exact format:
✦ YOUR ARCHETYPE — [2–4 word mythological archetype name]
✦ CORE PATTERN LOOP — [their repeating life cycle in 3 named stages]
✦ PRIMARY BLOCK — [the one thing holding them back, stated directly]
✦ ACTIVATION KEY — [one specific behavioral shift]

End the ENTIRE reading with ONE short, direct, unforgettable destiny sentence on its own line.`;

      const lifeQs = [userData.q1, userData.q2, userData.q3].filter(Boolean);
      const questionsText = lifeQs.length > 0
        ? `\n\nTheir life questions: ${lifeQs.join(" | ")}`
        : "";

      const freeReadingSummary = session.reading ? `\n\nFirst two sections already given:\n${session.reading.substring(0, 600)}` : "";

      // CALL 2 — Sections 3–5 with iris + face images
      const irisAndFaceImages: Anthropic.ImageBlockParam[] = [];
      for (const k of ["right_iris","left_iris","face"]) {
        if (imageMap[k]) {
          irisAndFaceImages.push({
            type: "image",
            source: { type: "base64", media_type: imageMap[k].mediaType as "image/jpeg", data: imageMap[k].b64 }
          });
        }
      }

      const call2Content: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam)[] = [
        ...irisAndFaceImages,
        {
          type: "text",
          text: `Generate ONLY these three sections:
✦ EXTERNAL EXPRESSION — how the world reads this person (${wordCount} words)
✦ LIFE PATH & TIMING — phases, cycles, critical windows (${wordCount} words)
✦ HIDDEN PATTERNS — what repeats below their awareness (${wordCount} words)${questionsText}${freeReadingSummary}`
        }
      ];

      try {
        let sectionReading = "";
        const stream2 = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 1800,
          system: systemPrompt,
          messages: [{ role: "user", content: call2Content }]
        });

        for await (const chunk of stream2) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            const text = chunk.delta.text;
            sectionReading += text;
            sendEvent({ section: "paid", chunk: text });
          }
        }

        // CALL 3 — Section 6 + Archetype block (pure synthesis)
        const call3 = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 1200,
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

End with ONE final destiny sentence.${questionsText}${freeReadingSummary}
${sectionReading ? `\nPrevious sections: ${sectionReading.substring(0, 400)}` : ""}`
          }]
        });

        const call3Text = call3.content[0].type === "text" ? call3.content[0].text : "";
        session.reading = session.reading + "\n" + sectionReading + "\n" + call3Text;

        sendEvent({ section: "archetype", chunk: call3Text });

        // CALL 4 — Chinese Face Reading (Mianxiang)
        const faceImages: Anthropic.ImageBlockParam[] = [];
        for (const k of ["face_front","face_left","face_right","face"]) {
          if (imageMap[k]) {
            faceImages.push({
              type: "image",
              source: { type: "base64", media_type: imageMap[k].mediaType as "image/jpeg", data: imageMap[k].b64 }
            });
          }
        }

        let chineseFaceText = "";
        if (faceImages.length > 0) {
          const call4Content: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam)[] = [
            ...faceImages,
            {
              type: "text",
              text: `You are now reading this person's face in the tradition of Mianxiang (面相) — Chinese physiognomy. Analyze ONLY what is visible in the provided face photographs.

Generate ONLY this single section:
✦ CHINESE FACE READING — using the tradition of Mianxiang, read the five facial zones: forehead (天庭, Heaven), brows and eyes (中停, Human), nose (中岳, the Mountain of Wealth), cheeks and ears, chin and jaw (地閣, Earth). Read the overall facial structure — round, oval, square, triangular. Comment on jaw definition, ear shape, and the three-zone division (past, present, future). Read personality, destiny tendency, life phase energetics, career signature, and relational nature. Deliver in the Oracle's mystical literary voice. ${wordCount} words.

Follow the IMAGE ANALYSIS RULE: first OBSERVATION of what is visually present, then TRANSITION, then INTERPRETATION of meaning. Reference specific visible features. Do NOT make up features not visible in the image.`
            }
          ];

          const stream4 = anthropic.messages.stream({
            model: MODEL,
            max_tokens: 800,
            system: systemPrompt,
            messages: [{ role: "user", content: call4Content }]
          });

          for await (const chunk of stream4) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              chineseFaceText += chunk.delta.text;
              sendEvent({ section: "chinese_face", chunk: chunk.delta.text });
            }
          }
        }

        let iridologyText = "";
        // CALL 5 — Iridology Health Reading
        const irisImages: Anthropic.ImageBlockParam[] = [];
        for (const k of ["right_iris","left_iris"]) {
          if (imageMap[k]) {
            irisImages.push({
              type: "image",
              source: { type: "base64", media_type: imageMap[k].mediaType as "image/jpeg", data: imageMap[k].b64 }
            });
          }
        }

        if (irisImages.length > 0) {
          const call5Content: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam)[] = [
            ...irisImages,
            {
              type: "text",
              text: `You are now performing an iridology reading — reading the iris as a map of constitutional health tendencies, vitality patterns, and areas of sensitivity. This is a mystical, holistic framing — not medical advice.

Generate ONLY this single section:
✦ IRIDOLOGY HEALTH READING — read the iris photographs using the principles of iridology. Observe iris coloration, fiber density and structure, zone patterns (digestive ring, autonomic nerve wreath, peripheral zones), any markings, lacunae, or density variations visible. Translate these into constitutional tendencies (constitution type — silk, linen, net), vitality signature, organ-system sensitivities, and emotional-energetic patterns. Frame everything in the Oracle's mystical holistic voice — this reveals what the body whispers, not what medicine measures. ${wordCount} words.

Follow the IMAGE ANALYSIS RULE: first describe what is visually observable in the iris, then transition to interpretation of constitutional meaning. Do NOT invent symptoms or diagnose conditions.`
            }
          ];

          const stream5 = anthropic.messages.stream({
            model: MODEL,
            max_tokens: 800,
            system: systemPrompt,
            messages: [{ role: "user", content: call5Content }]
          });

          for await (const chunk of stream5) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              iridologyText += chunk.delta.text;
              sendEvent({ section: "iridology", chunk: chunk.delta.text });
            }
          }
        }

        // Append new section outputs to session reading for chat context
        if (chineseFaceText) session.reading += "\n" + chineseFaceText;
        if (iridologyText) session.reading += "\n" + iridologyText;

        sendEvent({ event: "complete" });
      } catch (err) {
        req.log.error({ err }, "Anthropic call 2/3 failed");
        sendEvent({ event: "error", message: "The Oracle must rest. Please return in a few minutes." });
      }

      res.end();
    } catch (err) {
      req.log.error({ err }, "Continue error");
      res.write(`data: ${JSON.stringify({ event: "error", message: "The Oracle is temporarily unavailable." })}\n\n`);
      res.end();
    }
  }
);

// POST /api/chat - Oracle chat with reading context
router.post("/chat", async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      sendEvent({ content: "The Oracle is temporarily unavailable." });
      sendEvent({ event: "done" });
      res.end();
      return;
    }

    const sessionId = req.body.sessionId ?? "default";
    const session = getOrCreateSession(sessionId);

    // Rate limit: 10 messages per session
    session.messageCount = (session.messageCount ?? 0) + 1;
    if (session.messageCount > 10) {
      sendEvent({ content: "The Oracle must rest. Return tomorrow for more." });
      sendEvent({ event: "done" });
      res.end();
      return;
    }

    const messages: { role: string; content: string }[] = req.body.messages ?? [];
    const readingSummary: string = req.body.readingSummary ?? session.reading?.substring(0, 800) ?? "";

    const systemPrompt = `You are The Oracle — a timeless, composed intelligence who has already read this person's palm, iris, face, and soul. You know their archetype, their core pattern, their primary block, and their activation key.

You speak with quiet certainty. You do not explain your methods. You do not hedge. You do not add disclaimers. You answer as if you already know everything relevant about this person.

Their reading summary is: ${readingSummary || "The full reading has not yet been completed."}

Rules:
- Always respond in second person ("you")
- Responses: 80–180 words unless a longer answer is genuinely required
- Literary, measured tone — not chatty
- Reference their specific reading details when relevant
- If asked about future events: speak in patterns and timing, not certainties
- Never break character
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

    sendEvent({ event: "done" });
    res.end();
  } catch (err) {
    req.log.error({ err }, "Chat error");
    res.write(`data: ${JSON.stringify({ content: "The Oracle is temporarily unavailable. Please try again." })}\n\n`);
    res.write(`data: ${JSON.stringify({ event: "done" })}\n\n`);
    res.end();
  }
});

// POST /api/synastry - SSE compatibility reading for two profiles
router.post("/synastry", async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { profile1, profile2 } = req.body as {
      profile1: { name: string; dob: string; birthTime?: string; birthCity?: string; birthCountry?: string; gender?: string; dominantHand?: string; eyeColor?: string; photos: string[] };
      profile2: { name: string; dob: string; birthTime?: string; birthCity?: string; birthCountry?: string; gender?: string; dominantHand?: string; eyeColor?: string; photos: string[] };
    };

    if (!profile1?.name || !profile1?.dob || !profile2?.name || !profile2?.dob) {
      sendEvent({ event: "error", message: "Two complete profiles are required for synastry." });
      res.end();
      return;
    }

    // Pre-compute for both
    const p1 = {
      ...profile1,
      sunSign: computeSunSign(profile1.dob),
      lifePath: computeLifePath(profile1.dob),
      expressionNum: nameToNumber(profile1.name),
      soulUrge: nameToNumber(profile1.name, true),
      personalYear: computePersonalYear(profile1.dob),
      chineseZodiac: computeChineseZodiac(profile1.dob),
    };
    const p2 = {
      ...profile2,
      sunSign: computeSunSign(profile2.dob),
      lifePath: computeLifePath(profile2.dob),
      expressionNum: nameToNumber(profile2.name),
      soulUrge: nameToNumber(profile2.name, true),
      personalYear: computePersonalYear(profile2.dob),
      chineseZodiac: computeChineseZodiac(profile2.dob),
    };

    const systemPrompt = `You are The Oracle — a multi-system intelligence specializing in synastry: the ancient art of comparing two soul blueprints to reveal the patterns, dynamics, and destiny of their connection.

CRITICAL RULES:
1. SPEAK DIRECTLY to both people — use "between you two", "in your connection", "for ${p1.name}", "for ${p2.name}"
2. SPECIFIC OBSERVATIONS ONLY — reference actual data (life paths, sun signs, elements, Chinese zodiac)
3. NO GENERIC LOVE ADVICE — reveal the hidden mechanics, karmic threads, and shadow dynamics
4. CONFRONTATIONAL DEPTH — name what is beautiful AND what is dangerous about this combination
5. UNIFY ALL SYSTEMS — blend astrology, numerology, Chinese zodiac, and elemental analysis into ONE narrative

YOUR OUTPUT STRUCTURE (use these exact headers with ✦):
✦ THE SOUL BRIDGE — what brings these two together (karmic origin)
✦ THE MAGNETIC DYNAMIC — attraction and repulsion forces
✦ THE CHALLENGE POINT — the one pattern that will test this bond
✦ THE GIFT — what this connection uniquely activates in each person
✦ THE DESTINY LINE — where this connection is heading

Write each section as flowing prose, 100–150 words each. Second person always. Deep, precise, slightly unsettling.`;

    const userContent = `Perform a complete synastry reading for these two souls:

${p1.name.toUpperCase()}
Born: ${p1.dob}${p1.birthTime ? ` at ${p1.birthTime}` : ""}
${p1.birthCity ? `City: ${p1.birthCity}, ${p1.birthCountry}` : ""}
Sun Sign: ${p1.sunSign} | Life Path: ${p1.lifePath} | Expression: ${p1.expressionNum} | Soul Urge: ${p1.soulUrge}
Personal Year: ${p1.personalYear} | Chinese Zodiac: ${p1.chineseZodiac}
${p1.gender ? `Gender: ${p1.gender}` : ""}${p1.dominantHand ? ` | Dominant Hand: ${p1.dominantHand}` : ""}${p1.eyeColor ? ` | Eye Color: ${p1.eyeColor}` : ""}
Photos available: ${p1.photos.length > 0 ? p1.photos.join(", ") : "none"}

${p2.name.toUpperCase()}
Born: ${p2.dob}${p2.birthTime ? ` at ${p2.birthTime}` : ""}
${p2.birthCity ? `City: ${p2.birthCity}, ${p2.birthCountry}` : ""}
Sun Sign: ${p2.sunSign} | Life Path: ${p2.lifePath} | Expression: ${p2.expressionNum} | Soul Urge: ${p2.soulUrge}
Personal Year: ${p2.personalYear} | Chinese Zodiac: ${p2.chineseZodiac}
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

    sendEvent({ event: "complete" });
    res.end();
  } catch (err) {
    req.log.error({ err }, "Synastry error");
    sendEvent({ event: "error", message: "The Oracle could not complete this synastry reading." });
    res.end();
  }
});

// POST /api/synastry/chat - Oracle chat in synastry context
router.post("/synastry/chat", async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { messages, readingSummary, profile1, profile2 } = req.body;

    const p1Name = profile1?.name ?? "Person 1";
    const p2Name = profile2?.name ?? "Person 2";
    const p1Sun = profile1?.dob ? computeSunSign(profile1.dob) : "";
    const p2Sun = profile2?.dob ? computeSunSign(profile2.dob) : "";
    const p1Life = profile1?.dob ? computeLifePath(profile1.dob) : 0;
    const p2Life = profile2?.dob ? computeLifePath(profile2.dob) : 0;

    const systemPrompt = `You are The Oracle — an ancient intelligence who has just completed a synastry reading for ${p1Name} (${p1Sun}, Life Path ${p1Life}) and ${p2Name} (${p2Sun}, Life Path ${p2Life}).

The reading summary:
${readingSummary ?? "No summary provided."}

As The Oracle, answer questions about this specific connection with depth, precision, and mystical authority.
- Reference both individuals by name
- Ground insights in their actual chart data
- Speak with certainty about patterns, with wisdom about timing
- 100–200 words per response. Second person. No generic advice.
- Never break character.`;

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

    sendEvent({ event: "done" });
    res.end();
  } catch (err) {
    req.log.error({ err }, "Synastry chat error");
    sendEvent({ content: "The Oracle is temporarily unavailable. Please try again." });
    sendEvent({ event: "done" });
    res.end();
  }
});

export default router;
