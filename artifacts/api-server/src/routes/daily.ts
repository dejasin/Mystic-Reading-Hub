import { Router, type IRouter, type Request, type Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { eq, and, desc } from "drizzle-orm";
import { db, dailyContentTable, sessionsTable } from "@workspace/db";

const router: IRouter = Router();

const anthropicApiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY;
const anthropicBaseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;

const anthropic = new Anthropic({
  apiKey: anthropicApiKey,
  ...(anthropicBaseUrl ? { baseURL: anthropicBaseUrl } : {}),
});

const DAILY_MODEL = "claude-opus-4-5";

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

const MAX_NAME_LEN = 100;

function validateInput(profileId: unknown, name: unknown): string | null {
  if (!profileId || typeof profileId !== "string" || profileId.length > 200) return "Invalid profileId";
  if (!name || typeof name !== "string" || name.length > MAX_NAME_LEN) return "Invalid name";
  return null;
}

// Pull the most recent themes from this profile's most recent completed
// session reading, if any. Used as the input signal for daily/weekly
// reflections — replaces the deleted DOB-derived blocks (Task #60).
async function fetchSessionThemes(sessionId?: string | null): Promise<string> {
  if (!sessionId || typeof sessionId !== "string") return "";
  try {
    const rows = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.sessionId, sessionId))
      .limit(1);
    const r = rows[0];
    if (r?.reading) return r.reading.substring(0, 1200);
  } catch (e) {
    console.error("Failed to load session themes for daily/weekly:", e);
  }
  return "";
}

router.post("/daily-oracle", async (req: Request, res: Response) => {
  try {
    const { profileId, name, sessionId } = req.body as { profileId?: string; name?: string; sessionId?: string };

    const validationError = validateInput(profileId, name);
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
          eq(dailyContentTable.profileId, profileId!),
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
        label: "Daily Reflection",
      });
      return;
    }

    if (!anthropicApiKey) {
      res.status(503).json({ error: "The Oracle is temporarily unavailable." });
      return;
    }

    const themes = await fetchSessionThemes(sessionId);
    const now = new Date();
    const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
    const monthName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][now.getMonth()];

    const themesBlock = themes
      ? `RECENT BEHAVIORAL READING THEMES (use these as the input signal — never quote back verbatim):\n${themes}`
      : `No prior Oracle reading is available for ${name}. Speak generally to the seeker's invitation to reflect today.`;

    const prompt = `You are The Oracle — a personal AI life advisor that produces a behavioral profile from the seeker's questionnaire and hand photographs. You are not a fortune teller.

Generate a personalized Daily Reflection for ${name} for today (${dayOfWeek}, ${monthName} ${now.getDate()}, ${now.getFullYear()}).

${themesBlock}

RULES:
1. Speak directly to the seeker in second person ("you").
2. The reflection must feel deeply personal, not generic horoscope filler.
3. Reference patterns from their reading themes when available — never name the system that produced them.
4. Include one specific, actionable thing to try today.
5. Include one quietly confronting line — something to be mindful of.
6. The tone is warm but authoritative — like a perceptive mentor who sees clearly.
7. 80–120 words.
8. No markdown, no headers, no bullet points.
9. Do NOT mention numerology, astrology, life path, sun sign, zodiac, tarot, or any divination system.
10. Begin directly with the reflection — no greetings, no titles.
11. End with a single evocative closing line that lingers.`;

    const response = await anthropic.messages.create({
      model: DAILY_MODEL,
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0].type === "text" ? response.content[0].text : "";

    await db.insert(dailyContentTable).values({
      profileId: profileId!,
      contentType: "daily",
      contentDate: today,
      content,
    }).onConflictDoNothing();

    res.json({ content, date: today, cached: false, label: "Daily Reflection" });
  } catch (e) {
    console.error("Daily reflection error:", e);
    res.status(500).json({ error: "Failed to generate today's reflection." });
  }
});

router.post("/weekly-forecast", async (req: Request, res: Response) => {
  try {
    const { profileId, name, sessionId } = req.body as { profileId?: string; name?: string; sessionId?: string };

    const validationError = validateInput(profileId, name);
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
          eq(dailyContentTable.profileId, profileId!),
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
        label: "This Week's Focus",
      });
      return;
    }

    if (!anthropicApiKey) {
      res.status(503).json({ error: "The Oracle is temporarily unavailable." });
      return;
    }

    const themes = await fetchSessionThemes(sessionId);

    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const themesBlock = themes
      ? `RECENT BEHAVIORAL READING THEMES (use these as the input signal — never quote back verbatim):\n${themes}`
      : `No prior Oracle reading is available for ${name}. Speak generally to a seeker stepping into a new week of self-reflection.`;

    const prompt = `You are The Oracle — a personal AI life advisor that produces a behavioral profile from the seeker's questionnaire and hand photographs. You are not a fortune teller.

Generate a personalized "This Week's Focus" reflection for ${name} for the week of ${monthNames[monday.getMonth()]} ${monday.getDate()} – ${monthNames[sunday.getMonth()]} ${sunday.getDate()}, ${monday.getFullYear()}.

${themesBlock}

STRUCTURE (write as flowing prose, NO headers or bullets):
1. Opening: name the behavioral focus of this week for them (2–3 sentences).
2. Early Week (Mon–Wed): the pattern most likely to show up and what to do with it.
3. Mid-Week (Thu): a turning point or insight to watch for.
4. Late Week (Fri–Sun): what tends to need to land for the week to settle.
5. Closing: one sentence of grounded wisdom for the week.

RULES:
1. Second person ("you").
2. Reference themes from their reading naturally — never name the system that produced them.
3. Specific, actionable guidance woven into the narrative.
4. 200–280 words.
5. No markdown, no headers, no bullets — pure flowing prose.
6. Do NOT mention numerology, astrology, life path, sun sign, zodiac, tarot, or any divination system.
7. No specific predictions of events. Speak in patterns and tendencies.
8. Begin directly — no greetings.`;

    const response = await anthropic.messages.create({
      model: DAILY_MODEL,
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0].type === "text" ? response.content[0].text : "";

    await db.insert(dailyContentTable).values({
      profileId: profileId!,
      contentType: "weekly",
      contentDate: weekStr,
      content,
    }).onConflictDoNothing();

    res.json({ content, date: weekStr, cached: false, label: "This Week's Focus" });
  } catch (e) {
    console.error("Weekly focus error:", e);
    res.status(500).json({ error: "Failed to generate this week's focus." });
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
      entries: entries.map((e: typeof entries[number]) => ({
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
