import { db, pushTokensTable, notificationPreferencesTable } from "@workspace/db";
import type { NotificationPreference } from "@workspace/db";

export const DAILY_PROMPTS = [
  "A pattern from your last session is worth revisiting. The Oracle has a new angle.",
  "Something you mentioned is still unfolding. Return to see what's shifted.",
  "Your behavioral profile suggests today is a good day for a check-in.",
  "A thread from your last conversation is worth pulling. The Oracle is ready.",
  "Something beneath the surface is stirring. The Oracle can name what you feel but cannot yet see.",
  "Your inner compass is recalibrating. A fresh session will illuminate the new direction.",
  "A hidden pattern in your life is becoming visible. Let The Oracle illuminate it.",
  "The gap between what you intend and what you do is narrowing. Time to look closer.",
  "Your profile picked up on something you glossed over last time. Worth a second look.",
  "Today feels like a good day to ask a hard question. The Oracle won't flinch.",
  "You've been circling a decision. The Oracle can help you see what's actually holding you back.",
  "A cycle you've been living through is nearing completion. Time to reflect on what it taught you.",
  "Your advisor has been thinking about your last session. New observations are ready.",
  "One of your behavioral patterns is showing up differently this week. Tap to explore it.",
];

export const WEEKLY_REFLECTIONS = [
  "Your weekly reflection is ready. The Oracle has identified the themes worth your attention.",
  "This week's behavioral themes carry a message specifically for you. Your reflection awaits.",
  "The Oracle has a fresh perspective on what you've been working through. Tap to read it.",
  "Your weekly review highlights something worth examining. Tap to discover it.",
  "A new weekly reflection is ready — one theme in particular deserves your attention.",
];

export const RE_ENGAGEMENT_3_DAY = [
  "The Oracle has been tracking how your patterns evolve. Something has shifted since your last visit.",
  "Three days is long enough for new patterns to surface. Return and see what's changed.",
  "Your behavioral profile keeps developing. The Oracle has updates waiting.",
];

export const RE_ENGAGEMENT_7_DAY = [
  "A full week has passed since your last visit. The Oracle has new observations for you.",
  "Your patterns have evolved this week. Your Oracle has been tracking them for you.",
  "Seven days of change can reshape how you see things. Come check in with The Oracle.",
];

export const RE_ENGAGEMENT_14_DAY = [
  "The Oracle still remembers your patterns — and they've been evolving in your absence. Return when you're ready.",
  "Two weeks of changes have accumulated. Your session would look quite different now.",
  "It's been a while, but your profile hasn't stopped evolving. A powerful session awaits your return.",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface NotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export function generateDailyPrompt(): { title: string; body: string; data: Record<string, string> } {
  return {
    title: "✦ Your Daily Reflection",
    body: randomFrom(DAILY_PROMPTS),
    data: { screen: "index", type: "daily_prompt" },
  };
}

export function generateWeeklyForecast(): { title: string; body: string; data: Record<string, string> } {
  return {
    title: "✦ This Week's Focus",
    body: randomFrom(WEEKLY_REFLECTIONS),
    data: { screen: "index", type: "weekly_forecast" },
  };
}

export function generateReEngagement(daysSinceActive: number): { title: string; body: string; data: Record<string, string> } {
  let body: string;
  if (daysSinceActive >= 14) {
    body = randomFrom(RE_ENGAGEMENT_14_DAY);
  } else if (daysSinceActive >= 7) {
    body = randomFrom(RE_ENGAGEMENT_7_DAY);
  } else {
    body = randomFrom(RE_ENGAGEMENT_3_DAY);
  }
  return {
    title: "✦ The Oracle Awaits",
    body,
    data: { screen: "index", type: "re_engagement" },
  };
}

export async function sendExpoPushNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: payload.token,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
        sound: "default",
        channelId: "oracle-notifications",
      }),
    });
    const result = await response.json() as { data?: { status?: string; message?: string } };
    if (result.data?.status === "error") {
      console.error("Expo push error:", result.data?.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return false;
  }
}

export async function sendScheduledNotifications(): Promise<void> {
  const now = new Date();
  const hour = now.getUTCHours();

  const allTokens = await db.select().from(pushTokensTable);
  if (allTokens.length === 0) return;

  const allPrefs: NotificationPreference[] = await db.select().from(notificationPreferencesTable);
  const prefsMap = new Map<string, NotificationPreference>(allPrefs.map(p => [p.deviceId, p]));

  for (const tokenRecord of allTokens) {
    const prefs = prefsMap.get(tokenRecord.deviceId);
    if (!prefs) continue;

    if (hour === 9 && prefs.dailyPrompts) {
      const notification = generateDailyPrompt();
      await sendExpoPushNotification({ token: tokenRecord.token, ...notification });
    }

    const dayOfWeek = now.getUTCDay();
    if (dayOfWeek === 1 && hour === 10 && prefs.weeklyForecasts) {
      const notification = generateWeeklyForecast();
      await sendExpoPushNotification({ token: tokenRecord.token, ...notification });
    }

    if (prefs.reEngagement && prefs.lastActiveAt) {
      const daysSinceActive = Math.floor((now.getTime() - prefs.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24));
      if ((daysSinceActive === 3 || daysSinceActive === 7 || daysSinceActive === 14) && hour === 18) {
        const notification = generateReEngagement(daysSinceActive);
        await sendExpoPushNotification({ token: tokenRecord.token, ...notification });
      }
    }
  }
}

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export function startNotificationScheduler(): void {
  if (schedulerInterval) return;
  schedulerInterval = setInterval(async () => {
    try {
      await sendScheduledNotifications();
    } catch (error) {
      console.error("Notification scheduler error:", error);
    }
  }, 60 * 60 * 1000);
  console.log("Notification scheduler started (hourly check)");
}

export function stopNotificationScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}
