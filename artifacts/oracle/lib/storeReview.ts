import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const REVIEW_LAST_PROMPT_KEY = "@oracle_review_last_prompt";
const REVIEW_WINDOW_START_KEY = "@oracle_review_window_start";
const REVIEW_WINDOW_COUNT_KEY = "@oracle_review_window_count";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const MAX_PROMPTS_PER_YEAR = 3;
const PROMPT_DELAY_MS = 2000;

async function canPromptReview(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;

  try {
    const [lastPromptStr, windowStartStr, windowCountStr] = await Promise.all([
      AsyncStorage.getItem(REVIEW_LAST_PROMPT_KEY),
      AsyncStorage.getItem(REVIEW_WINDOW_START_KEY),
      AsyncStorage.getItem(REVIEW_WINDOW_COUNT_KEY),
    ]);

    const now = Date.now();

    if (lastPromptStr) {
      const lastPrompt = parseInt(lastPromptStr, 10);
      if (now - lastPrompt < THIRTY_DAYS_MS) return false;
    }

    if (windowStartStr && windowCountStr) {
      const windowStart = parseInt(windowStartStr, 10);
      const count = parseInt(windowCountStr, 10);

      if (now - windowStart < ONE_YEAR_MS) {
        if (count >= MAX_PROMPTS_PER_YEAR) return false;
      } else {
        await Promise.all([
          AsyncStorage.setItem(REVIEW_WINDOW_START_KEY, String(now)),
          AsyncStorage.setItem(REVIEW_WINDOW_COUNT_KEY, "0"),
        ]);
      }
    }

    return true;
  } catch {
    return false;
  }
}

async function recordPrompt(): Promise<void> {
  try {
    const [windowStartStr, windowCountStr] = await Promise.all([
      AsyncStorage.getItem(REVIEW_WINDOW_START_KEY),
      AsyncStorage.getItem(REVIEW_WINDOW_COUNT_KEY),
    ]);

    const now = Date.now();
    const windowStart = windowStartStr ? parseInt(windowStartStr, 10) : now;
    const count = windowCountStr ? parseInt(windowCountStr, 10) : 0;

    const isNewWindow = !windowStartStr || now - windowStart >= ONE_YEAR_MS;

    await Promise.all([
      AsyncStorage.setItem(REVIEW_LAST_PROMPT_KEY, String(now)),
      AsyncStorage.setItem(REVIEW_WINDOW_START_KEY, String(isNewWindow ? now : windowStart)),
      AsyncStorage.setItem(REVIEW_WINDOW_COUNT_KEY, String(isNewWindow ? 1 : count + 1)),
    ]);
  } catch {}
}

export async function maybeRequestReview(): Promise<void> {
  if (Platform.OS !== "ios") return;

  const allowed = await canPromptReview();
  if (!allowed) return;

  try {
    const StoreReview = await import("expo-store-review");

    const available = await StoreReview.isAvailableAsync();
    if (!available) return;

    await new Promise((resolve) => setTimeout(resolve, PROMPT_DELAY_MS));

    await StoreReview.requestReview();
    await recordPrompt();
  } catch {}
}
