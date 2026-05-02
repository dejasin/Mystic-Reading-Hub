import { describe, it, expect } from "vitest";
import {
  QUESTIONNAIRE_QUESTIONS,
  QUESTIONNAIRE_STORAGE_KEY,
} from "../lib/questionnaireData";

const REQUIRED_FIELDS = [
  "decisionStyle",
  "pressureResponse",
  "relationshipPattern",
  "coreMotivation",
  "biggestChallenge",
  "energyStyle",
  "currentNeed",
  "selfPerception",
] as const;

describe("questionnaire data", () => {
  it("uses the persistence key Task #60 promised", () => {
    // The mobile app, /retake button, and any future migration all rely on
    // this exact AsyncStorage key. Changing it silently would orphan answers.
    expect(QUESTIONNAIRE_STORAGE_KEY).toBe("oracle_questionnaire_answers");
  });

  it("has exactly 8 questions in the documented order", () => {
    expect(QUESTIONNAIRE_QUESTIONS).toHaveLength(8);
    expect(QUESTIONNAIRE_QUESTIONS.map((q) => q.field)).toEqual([...REQUIRED_FIELDS]);
  });

  it("gives every question a non-empty prompt and 4 distinct options", () => {
    for (const q of QUESTIONNAIRE_QUESTIONS) {
      expect(q.prompt.length).toBeGreaterThan(8);
      expect(q.options).toHaveLength(4);
      const values = q.options.map((o) => o.value);
      expect(new Set(values).size).toBe(4);
      for (const opt of q.options) {
        expect(opt.label.length).toBeGreaterThan(0);
        expect(opt.value.length).toBeGreaterThan(0);
        expect(opt.icon.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps coreMotivation values prefixed with the four archetype keywords", () => {
    // profiles.tsx getProfileIndicator switches on these prefixes — drifting
    // from this contract would break the indicator badge.
    const core = QUESTIONNAIRE_QUESTIONS.find((q) => q.field === "coreMotivation");
    expect(core).toBeDefined();
    const prefixes = core!.options.map((o) => o.value.split(" ")[0]).sort();
    expect(prefixes).toEqual(["Analyst", "Connector", "Creator", "Explorer"]);
  });
});
