import { describe, it, expect } from "vitest";
import { dayKey, bumpStreak, streakStatus } from "../src/core/streak.js";
import { newState } from "../src/core/state.js";

const DAY = 24 * 60 * 60 * 1000;

describe("dayKey (UTC)", () => {
  it("uses UTC calendar days, not local time", () => {
    expect(dayKey(Date.UTC(2024, 0, 1, 23, 30))).toBe("2024-01-01");
    expect(dayKey(Date.UTC(2024, 0, 2, 0, 30))).toBe("2024-01-02");
  });
});

describe("bumpStreak", () => {
  it("starts a streak at 1 on first activity", () => {
    const s = bumpStreak(newState("T", 0), Date.UTC(2024, 0, 1, 12));
    expect(s.streak).toEqual({ days: 1, longestDays: 1, lastActivityDay: "2024-01-01" });
  });

  it("does not double-count two prompts on the same UTC day", () => {
    let s = bumpStreak(newState("T", 0), Date.UTC(2024, 0, 1, 1));
    s = bumpStreak(s, Date.UTC(2024, 0, 1, 23));
    expect(s.streak?.days).toBe(1);
  });

  it("increments on consecutive days and tracks the longest", () => {
    let s = bumpStreak(newState("T", 0), Date.UTC(2024, 0, 1, 12));
    s = bumpStreak(s, Date.UTC(2024, 0, 2, 12));
    s = bumpStreak(s, Date.UTC(2024, 0, 3, 12));
    expect(s.streak?.days).toBe(3);
    expect(s.streak?.longestDays).toBe(3);
  });

  it("resets to 1 after a missed day but keeps the longest", () => {
    let s = bumpStreak(newState("T", 0), Date.UTC(2024, 0, 1, 12));
    s = bumpStreak(s, Date.UTC(2024, 0, 2, 12));
    s = bumpStreak(s, Date.UTC(2024, 0, 5, 12)); // skipped 3rd and 4th
    expect(s.streak?.days).toBe(1);
    expect(s.streak?.longestDays).toBe(2);
  });
});

describe("streakStatus", () => {
  it("reports broken once more than a day has passed since last activity", () => {
    const s = bumpStreak(newState("T", 0), Date.UTC(2024, 0, 1, 12));
    const status = streakStatus(s, Date.UTC(2024, 0, 1, 12) + 3 * DAY);
    expect(status).toEqual({ days: 0, broken: true });
  });
});
