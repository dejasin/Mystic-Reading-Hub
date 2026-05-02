import { describe, it, expect, beforeEach, vi } from "vitest";
import { QUESTIONNAIRE_STORAGE_KEY, QUESTIONNAIRE_QUESTIONS } from "../lib/questionnaireData";

// In-memory mock of @react-native-async-storage/async-storage that mirrors the
// real surface used by OracleContext. Routing logic in intake.tsx is mirrored
// here as a pure function so it can be tested without a React renderer.
class MemoryStorage {
  store = new Map<string, string>();
  async getItem(k: string) {
    return this.store.has(k) ? this.store.get(k)! : null;
  }
  async setItem(k: string, v: string) {
    this.store.set(k, v);
  }
  async removeItem(k: string) {
    this.store.delete(k);
  }
  async clear() {
    this.store.clear();
  }
}

const storage = new MemoryStorage();

// Mirrors the destination logic used by app/intake.tsx and the
// "Retake questionnaire" row in app/settings.tsx.
async function decideNextRoute(): Promise<"/questionnaire" | "/ritual"> {
  const raw = await storage.getItem(QUESTIONNAIRE_STORAGE_KEY);
  if (!raw) return "/questionnaire";
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const fields = QUESTIONNAIRE_QUESTIONS.map((q) => q.field);
    const complete = fields.every(
      (f) => typeof parsed[f] === "string" && (parsed[f] as string).length > 0,
    );
    return complete ? "/ritual" : "/questionnaire";
  } catch {
    return "/questionnaire";
  }
}

async function persistAnswers(answers: Record<string, string>) {
  await storage.setItem(QUESTIONNAIRE_STORAGE_KEY, JSON.stringify(answers));
}

async function retakeQuestionnaire() {
  await storage.removeItem(QUESTIONNAIRE_STORAGE_KEY);
}

const SAMPLE_ANSWERS = {
  decisionStyle: "Trust my gut, decide fast",
  pressureResponse: "Step back and observe",
  relationshipPattern: "I keep my walls up at first",
  coreMotivation: "Creator — Creating something meaningful",
  biggestChallenge: "Quieting overthinking",
  energyStyle: "Steady current — even all day",
  currentNeed: "Direction — to know which way",
  selfPerception: "They see clearly through me",
};

describe("questionnaire flow", () => {
  beforeEach(() => {
    storage.store.clear();
  });

  it("first-time user → routed to /questionnaire", async () => {
    const dest = await decideNextRoute();
    expect(dest).toBe("/questionnaire");
  });

  it("returning user with stored answers → routed to /ritual", async () => {
    await persistAnswers(SAMPLE_ANSWERS);
    const dest = await decideNextRoute();
    expect(dest).toBe("/ritual");
  });

  it("partial answers (missing field) → routed back to /questionnaire", async () => {
    const partial = { ...SAMPLE_ANSWERS, selfPerception: "" };
    await persistAnswers(partial);
    const dest = await decideNextRoute();
    expect(dest).toBe("/questionnaire");
  });

  it("corrupted JSON in storage → routed to /questionnaire (no crash)", async () => {
    await storage.setItem(QUESTIONNAIRE_STORAGE_KEY, "{not json");
    const dest = await decideNextRoute();
    expect(dest).toBe("/questionnaire");
  });

  it("Retake questionnaire clears storage and re-routes to /questionnaire", async () => {
    await persistAnswers(SAMPLE_ANSWERS);
    expect(await decideNextRoute()).toBe("/ritual");

    await retakeQuestionnaire();

    expect(await storage.getItem(QUESTIONNAIRE_STORAGE_KEY)).toBeNull();
    expect(await decideNextRoute()).toBe("/questionnaire");
  });

  it("walking through all 8 questions persists every field", async () => {
    // Simulates the user tapping one option per question, advancing through
    // QUESTIONNAIRE_QUESTIONS, then committing answers at the end.
    const collected: Record<string, string> = {};
    for (const q of QUESTIONNAIRE_QUESTIONS) {
      const tapped = q.options[0]; // first option, as if tapping the first card
      collected[q.field] = tapped.value;
    }
    await persistAnswers(collected);

    const raw = await storage.getItem(QUESTIONNAIRE_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(Object.keys(parsed)).toHaveLength(8);
    for (const q of QUESTIONNAIRE_QUESTIONS) {
      expect(parsed[q.field]).toBe(q.options[0].value);
    }
    expect(await decideNextRoute()).toBe("/ritual");
  });
});

// Sanity guard so vi import isn't tree-shaken out.
vi.fn();
