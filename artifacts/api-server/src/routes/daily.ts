import { Router, type IRouter, type Request, type Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, dailyContentTable } from "@workspace/db";

const router: IRouter = Router();

const anthropicApiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY;
const anthropicBaseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;

const anthropic = new Anthropic({
  apiKey: anthropicApiKey,
  ...(anthropicBaseUrl ? { baseURL: anthropicBaseUrl } : {}),
});

const DAILY_MODEL = "claude-opus-4-5";

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

function computePersonalDay(dob: string): number {
  const now = new Date();
  const d = new Date(dob);
  const digits = `${d.getUTCMonth() + 1}${d.getUTCDate()}${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}`
    .split("")
    .map(Number);
  return reduceDigits(digits.reduce((a, b) => a + b, 0));
}

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getWeekStr(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  return `week-${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
}

const ARCHETYPE_MAP: Record<number, string> = {
  1: "The Pioneer",
  2: "The Diplomat",
  3: "The Creator",
  4: "The Builder",
  5: "The Adventurer",
  6: "The Nurturer",
  7: "The Seeker",
  8: "The Sovereign",
  9: "The Sage",
  11: "The Visionary",
  22: "The Master Builder",
  33: "The Master Teacher",
};

const DOB_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NAME_LEN = 100;

function validateInput(profileId: unknown, name: unknown, dob: unknown): string | null {
  if (!profileId || typeof profileId !== "string" || profileId.length > 200) return "Invalid profileId";
  if (!name || typeof name !== "string" || name.length > MAX_NAME_LEN) return "Invalid name";
  if (!dob || typeof dob !== "string" || !DOB_REGEX.test(dob)) return "Invalid dob format (expected YYYY-MM-DD)";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "Invalid date";
  return null;
}

router.post("/daily-oracle", async (req: Request, res: Response) => {
  try {
    const { profileId, name, dob } = req.body;

    const validationError = validateInput(profileId, name, dob);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const today = getTodayStr();

    const existing = await db
      .select()
      .from(dailyContentTable)
      .where(
        and(
          eq(dailyContentTable.profileId, profileId),
          eq(dailyContentTable.contentType, "daily"),
          eq(dailyContentTable.contentDate, today)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      res.json({
        content: existing[0].content,
        date: existing[0].contentDate,
        cached: true,
      });
      return;
    }

    if (!anthropicApiKey) {
      res.status(503).json({ error: "The Oracle is temporarily unavailable." });
      return;
    }

    const sunSign = computeSunSign(dob);
    const lifePath = computeLifePath(dob);
    const personalDay = computePersonalDay(dob);
    const archetype = ARCHETYPE_MAP[lifePath] || "The Seeker";
    const now = new Date();
    const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
    const monthName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][now.getMonth()];

    const prompt = `You are The Oracle — a mystical, deeply perceptive intelligence that speaks with warmth, gravity, and poetic precision.

Generate a personalized Daily Oracle message for today (${dayOfWeek}, ${monthName} ${now.getDate()}, ${now.getFullYear()}).

SEEKER PROFILE:
- Name: ${name}
- Elemental Signature: ${sunSign}
- Destiny Vibration: ${lifePath}
- Archetype: ${archetype}
- Current Day Vibration: ${personalDay}

RULES:
1. Speak directly to the seeker in second person ("you")
2. The message should feel deeply personal, not generic horoscope filler
3. Reference their archetype energy and current vibration naturally — never name the systems
4. Include one specific, actionable insight for the day
5. Include one subtle warning or thing to be mindful of
6. The tone should be warm but authoritative — like a wise mentor who sees clearly
7. Keep it between 80-120 words
8. Do NOT use any markdown, headers, or bullet points
9. Do NOT mention numerology, astrology, life path, sun sign, or any system names
10. Begin directly with the message — no greetings or titles
11. End with a single evocative closing line that lingers

FORBIDDEN WORDS: life path, sun sign, zodiac, numerology, astrology, horoscope, Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces`;

    const response = await anthropic.messages.create({
      model: DAILY_MODEL,
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0].type === "text" ? response.content[0].text : "";

    await db.insert(dailyContentTable).values({
      profileId,
      contentType: "daily",
      contentDate: today,
      content,
      lifePathNumber: lifePath,
      sunSign,
    }).onConflictDoNothing();

    res.json({ content, date: today, cached: false });
  } catch (e) {
    console.error("Daily oracle error:", e);
    res.status(500).json({ error: "Failed to generate daily oracle message." });
  }
});

router.post("/weekly-forecast", async (req: Request, res: Response) => {
  try {
    const { profileId, name, dob } = req.body;

    const validationError = validateInput(profileId, name, dob);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const weekStr = getWeekStr();

    const existing = await db
      .select()
      .from(dailyContentTable)
      .where(
        and(
          eq(dailyContentTable.profileId, profileId),
          eq(dailyContentTable.contentType, "weekly"),
          eq(dailyContentTable.contentDate, weekStr)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      res.json({
        content: existing[0].content,
        date: existing[0].contentDate,
        cached: true,
      });
      return;
    }

    if (!anthropicApiKey) {
      res.status(503).json({ error: "The Oracle is temporarily unavailable." });
      return;
    }

    const sunSign = computeSunSign(dob);
    const lifePath = computeLifePath(dob);
    const archetype = ARCHETYPE_MAP[lifePath] || "The Seeker";

    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const prompt = `You are The Oracle — a mystical, deeply perceptive intelligence that speaks with warmth, gravity, and poetic precision.

Generate a personalized Weekly Forecast for the week of ${monthNames[monday.getMonth()]} ${monday.getDate()} – ${monthNames[sunday.getMonth()]} ${sunday.getDate()}, ${monday.getFullYear()}.

SEEKER PROFILE:
- Name: ${name}
- Elemental Signature: ${sunSign}
- Destiny Vibration: ${lifePath}
- Archetype: ${archetype}

STRUCTURE (write as flowing prose, NO headers or bullets):
1. Opening: Set the energetic tone of the week (2-3 sentences)
2. Early Week (Mon-Wed): What energies are building, what to focus on
3. Mid-Week Shift (Thu): A turning point or insight to watch for
4. Late Week (Fri-Sun): How the week resolves, what to carry forward
5. Closing: One sentence of oracle wisdom for the week

RULES:
1. Speak directly in second person ("you")
2. Feel deeply personal, referencing their archetype energy naturally
3. Include specific actionable guidance woven into the narrative
4. Between 200-280 words
5. No markdown, headers, or bullet points — pure flowing prose
6. Do NOT mention numerology, astrology, life path, sun sign, or system names
7. Begin directly — no greetings

FORBIDDEN WORDS: life path, sun sign, zodiac, numerology, astrology, horoscope, Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces`;

    const response = await anthropic.messages.create({
      model: DAILY_MODEL,
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0].type === "text" ? response.content[0].text : "";

    await db.insert(dailyContentTable).values({
      profileId,
      contentType: "weekly",
      contentDate: weekStr,
      content,
      lifePathNumber: lifePath,
      sunSign,
    }).onConflictDoNothing();

    res.json({ content, date: weekStr, cached: false });
  } catch (e) {
    console.error("Weekly forecast error:", e);
    res.status(500).json({ error: "Failed to generate weekly forecast." });
  }
});

router.get("/daily-history/:profileId", async (req: Request, res: Response) => {
  try {
    const { profileId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 90);

    const entries = await db
      .select()
      .from(dailyContentTable)
      .where(
        and(
          eq(dailyContentTable.profileId, profileId),
          eq(dailyContentTable.contentType, "daily")
        )
      )
      .orderBy(desc(dailyContentTable.contentDate))
      .limit(limit);

    res.json({
      entries: entries.map((e) => ({
        content: e.content,
        date: e.contentDate,
      })),
    });
  } catch (e) {
    console.error("Daily history error:", e);
    res.status(500).json({ error: "Failed to fetch daily history." });
  }
});

export default router;
