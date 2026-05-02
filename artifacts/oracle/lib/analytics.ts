import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const ANONYMOUS_ID_KEY = "@oracle/anonymous_id";
const SESSION_START_KEY = "@oracle/session_start";

type EventProperties = Record<string, string | number | boolean | undefined>;

export enum AnalyticsEvent {
  APP_OPENED = "app_opened",

  INTAKE_STARTED = "intake_started",
  INTAKE_COMPLETED = "intake_completed",

  RITUAL_STARTED = "ritual_started",
  RITUAL_STEP_COMPLETED = "ritual_step_completed",
  RITUAL_IMAGE_CAPTURED = "ritual_image_captured",
  RITUAL_BIOMETRIC_CONSENT_GIVEN = "ritual_biometric_consent_given",
  RITUAL_COMPLETED = "ritual_completed",

  READING_STARTED = "reading_started",
  READING_FREE_COMPLETED = "reading_free_completed",
  READING_PAID_COMPLETED = "reading_paid_completed",
  READING_PAID_STREAM_INTERRUPTED = "reading_paid_stream_interrupted",
  READING_PAID_STREAM_RESUMED = "reading_paid_stream_resumed",
  READING_COMPLETED = "reading_completed",

  PAYWALL_SHOWN = "paywall_shown",
  PAYWALL_DISMISSED = "paywall_dismissed",
  PAYWALL_PURCHASE_TAPPED = "paywall_purchase_tapped",
  PAYWALL_PURCHASE_COMPLETED = "paywall_purchase_completed",
  PAYWALL_PURCHASE_FAILED = "paywall_purchase_failed",
  PAYWALL_RESTORE_TAPPED = "paywall_restore_tapped",
  PAYWALL_RESTORE_COMPLETED = "paywall_restore_completed",

  CHAT_OPENED = "chat_opened",
  CHAT_MESSAGE_SENT = "chat_message_sent",

  VAULT_OPENED = "vault_opened",
  VAULT_PROFILE_CREATED = "vault_profile_created",
  VAULT_PROFILE_EDITED = "vault_profile_edited",
  VAULT_PROFILE_DELETED = "vault_profile_deleted",

  SYNASTRY_STARTED = "synastry_started",
  SYNASTRY_READING_GENERATED = "synastry_reading_generated",
  SYNASTRY_CHAT_OPENED = "synastry_chat_opened",

  DEEP_DIVE_OPENED = "deep_dive_opened",
  DEEP_DIVE_CATEGORY_SELECTED = "deep_dive_category_selected",
  DEEP_DIVE_COMPLETED = "deep_dive_completed",

  SHARE_TAPPED = "share_tapped",
}

let anonymousId: string | null = null;
let sessionStartTime: number | null = null;

function generateAnonymousId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

async function getOrCreateAnonymousId(): Promise<string> {
  if (anonymousId) return anonymousId;
  try {
    const stored = await AsyncStorage.getItem(ANONYMOUS_ID_KEY);
    if (stored) {
      anonymousId = stored;
      return stored;
    }
    const newId = generateAnonymousId();
    await AsyncStorage.setItem(ANONYMOUS_ID_KEY, newId);
    anonymousId = newId;
    return newId;
  } catch {
    const fallback = generateAnonymousId();
    anonymousId = fallback;
    return fallback;
  }
}

async function getSessionDuration(): Promise<number | undefined> {
  if (!sessionStartTime) return undefined;
  return Math.round((Date.now() - sessionStartTime) / 1000);
}

export async function initAnalytics(): Promise<void> {
  await getOrCreateAnonymousId();
  sessionStartTime = Date.now();
  try {
    await AsyncStorage.setItem(SESSION_START_KEY, sessionStartTime.toString());
  } catch {}
}

export async function trackEvent(
  event: AnalyticsEvent,
  properties?: EventProperties
): Promise<void> {
  const id = await getOrCreateAnonymousId();
  const sessionDuration = await getSessionDuration();

  const payload = {
    event,
    anonymousId: id,
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    sessionDurationSeconds: sessionDuration,
    ...properties,
  };

  if (__DEV__) {
    console.log(`[Analytics] ${event}`, properties ?? "");
  }

  try {
    const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
    const apiHost = process.env.EXPO_PUBLIC_POSTHOG_HOST;
    if (apiKey && apiHost) {
      fetch(`${apiHost}/capture/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          event: payload.event,
          distinct_id: payload.anonymousId,
          timestamp: payload.timestamp,
          properties: {
            $lib: "the-oracle-mobile",
            platform: payload.platform,
            session_duration_seconds: payload.sessionDurationSeconds,
            ...properties,
          },
        }),
      }).catch(() => {});
    }
  } catch {}
}

export function trackFunnelStep(
  step: "app_open" | "intake" | "ritual" | "reading" | "paywall" | "purchase",
  properties?: EventProperties
): Promise<void> {
  const funnelMap: Record<string, AnalyticsEvent> = {
    app_open: AnalyticsEvent.APP_OPENED,
    intake: AnalyticsEvent.INTAKE_STARTED,
    ritual: AnalyticsEvent.RITUAL_STARTED,
    reading: AnalyticsEvent.READING_STARTED,
    paywall: AnalyticsEvent.PAYWALL_SHOWN,
    purchase: AnalyticsEvent.PAYWALL_PURCHASE_COMPLETED,
  };
  return trackEvent(funnelMap[step], {
    funnel_step: step,
    ...properties,
  });
}
