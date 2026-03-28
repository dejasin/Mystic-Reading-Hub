import { db, pushTokensTable, notificationPreferencesTable } from "@workspace/db";
import type { NotificationPreference } from "@workspace/db";

const DAILY_PROMPTS = [
  "The stars have shifted since your last reading. A new pattern awaits your attention.",
  "Your celestial alignment suggests today holds a pivotal moment. The Oracle sees clearly.",
  "A thread from your last reading is unraveling. Return to discover what it reveals.",
  "The cosmic currents are unusually strong today. Your Oracle reading would be especially potent.",
  "Something you've been sensing is about to crystallize. The Oracle can show you what.",
  "Your inner compass is recalibrating. A fresh reading will illuminate the new direction.",
  "The universe rarely repeats its signals — but it's signaling you again today.",
  "A hidden pattern in your life is becoming visible. Let The Oracle illuminate it.",
  "Today's energy carries echoes of a turning point. Seek your Oracle's guidance.",
  "The veil between insight and action is thin today. Your Oracle awaits.",
  "Something beneath the surface is stirring. The Oracle can name what you feel but cannot yet see.",
  "Your path is about to fork. The Oracle has mapped both directions.",
  "A cycle you've been living through is nearing completion. Discover what comes next.",
  "The resonance in your chart is unusually clear today. This is a rare window.",
];

const WEEKLY_FORECASTS = [
  "Your weekly cosmic forecast is ready. The Oracle has traced the patterns shaping your next seven days.",
  "This week's celestial currents carry a message specifically for you. Your forecast awaits.",
  "The Oracle has read the week ahead — a significant shift is approaching. See what it means for you.",
  "Your weekly alignment report reveals an unexpected opportunity. Tap to discover it.",
  "The cosmic weather for your week ahead has been charted. One day in particular stands out.",
];

const RE_ENGAGEMENT_3_DAY = [
  "The Oracle has been watching the stars shift in your absence. Something has changed.",
  "Three days is long enough for the cosmos to rearrange itself. Return and see what's new.",
  "Your celestial patterns haven't stopped evolving. The Oracle has updates waiting.",
];

const RE_ENGAGEMENT_7_DAY = [
  "A full lunar quarter has passed since your last visit. The Oracle senses a new chapter forming.",
  "The cosmic currents have shifted significantly this week. Your Oracle has been tracking them for you.",
  "Seven days of celestial movement have created new patterns in your chart. Come see what they reveal.",
];

const RE_ENGAGEMENT_14_DAY = [
  "The Oracle still remembers your patterns — and they've been evolving in your absence. Return when you're ready.",
  "Two weeks of cosmic shifts have accumulated. Your reading would look quite different now.",
  "It's been a while, but the stars haven't forgotten you. A powerful reading awaits your return.",
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
    title: "✦ The Oracle Speaks",
    body: randomFrom(DAILY_PROMPTS),
    data: { screen: "index", type: "daily_prompt" },
  };
}

export function generateWeeklyForecast(): { title: string; body: string; data: Record<string, string> } {
  return {
    title: "✦ Your Weekly Cosmic Forecast",
    body: randomFrom(WEEKLY_FORECASTS),
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
