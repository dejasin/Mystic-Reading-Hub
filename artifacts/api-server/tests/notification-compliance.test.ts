import { describe, it, expect, vi } from "vitest";

vi.mock("@workspace/db", () => ({
  db: {},
  pushTokensTable: {},
  notificationPreferencesTable: {},
}));

import {
  DAILY_PROMPTS,
  WEEKLY_REFLECTIONS,
  RE_ENGAGEMENT_3_DAY,
  RE_ENGAGEMENT_7_DAY,
  RE_ENGAGEMENT_14_DAY,
  generateDailyPrompt,
  generateWeeklyForecast,
  generateReEngagement,
} from "../src/services/notificationService";

const FORBIDDEN_TERMS = [
  "cosmic",
  "celestial",
  "lunar",
  "horoscope",
  "zodiac",
  "astrology",
  "tarot",
  "psychic",
  "divination",
  "forecast",
  "fortune",
  "numerology",
  "palm reading",
  "palm-reading",
  "chiromancy",
  "occult",
  "supernatural",
  "esoteric",
  "stars shift",
  "stars have shifted",
  "chart",
  "sun sign",
  "life path",
  "life-path",
];

const FORBIDDEN_REGEX = new RegExp(FORBIDDEN_TERMS.join("|"), "i");

const ALL_COPY_ARRAYS: Record<string, string[]> = {
  DAILY_PROMPTS,
  WEEKLY_REFLECTIONS,
  RE_ENGAGEMENT_3_DAY,
  RE_ENGAGEMENT_7_DAY,
  RE_ENGAGEMENT_14_DAY,
};

describe("Notification copy — App Store 4.3b compliance", () => {
  for (const [name, arr] of Object.entries(ALL_COPY_ARRAYS)) {
    describe(name, () => {
      it("should not be empty", () => {
        expect(arr.length).toBeGreaterThan(0);
      });

      it("should contain no forbidden divinatory terms", () => {
        for (const line of arr) {
          const match = line.match(FORBIDDEN_REGEX);
          expect(match, `"${line}" contains forbidden term "${match?.[0]}"`).toBeNull();
        }
      });

      it("every entry should be a non-empty string", () => {
        for (const line of arr) {
          expect(typeof line).toBe("string");
          expect(line.trim().length).toBeGreaterThan(0);
        }
      });
    });
  }

  describe("generateDailyPrompt()", () => {
    it("returns a compliant title and body", () => {
      const result = generateDailyPrompt();
      expect(result.title).toBeTruthy();
      expect(result.body).toBeTruthy();
      expect(result.title.match(FORBIDDEN_REGEX)).toBeNull();
      expect(result.body.match(FORBIDDEN_REGEX)).toBeNull();
    });
  });

  describe("generateWeeklyForecast()", () => {
    it("returns a compliant title and body", () => {
      const result = generateWeeklyForecast();
      expect(result.title).toBeTruthy();
      expect(result.body).toBeTruthy();
      expect(result.title.match(FORBIDDEN_REGEX)).toBeNull();
      expect(result.body.match(FORBIDDEN_REGEX)).toBeNull();
    });
  });

  describe("generateReEngagement()", () => {
    for (const days of [3, 7, 14]) {
      it(`returns compliant copy for ${days}-day re-engagement`, () => {
        const result = generateReEngagement(days);
        expect(result.title).toBeTruthy();
        expect(result.body).toBeTruthy();
        expect(result.title.match(FORBIDDEN_REGEX)).toBeNull();
        expect(result.body.match(FORBIDDEN_REGEX)).toBeNull();
      });
    }
  });
});
