import { describe, it, expect } from "vitest";
import { bumpStreak, dayKey, streakStatus } from "../src/core/streak.js";
import { newState } from "../src/core/state.js";
import type { State } from "../src/types.js";

// Local-noon timestamps avoid DST edge effects when adding whole days.
const NOON = new Date(2026, 0, 15, 12, 0, 0).getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

function stateWithStreak(days: number, longestDays: number, lastActivityTs: number): State {
  return {
    ...newState("T", NOON),
    streak: { days, longestDays, lastActivityDay: dayKey(lastActivityTs) },
  };
}

describe("dayKey", () => {
  it("formats as YYYY-MM-DD with zero padding", () => {
    expect(dayKey(new Date(2026, 0, 5, 9, 30).getTime())).toBe("2026-01-05");
  });

  it("is stable within the same local day", () => {
    const morning = new Date(2026, 5, 1, 0, 0, 1).getTime();
    const night = new Date(2026, 5, 1, 23, 59, 59).getTime();
    expect(dayKey(morning)).toBe(dayKey(night));
  });
});

describe("bumpStreak", () => {
  it("starts a streak of 1 when none exists", () => {
    const next = bumpStreak(newState("T", NOON), NOON);
    expect(next.streak).toEqual({ days: 1, longestDays: 1, lastActivityDay: dayKey(NOON) });
  });

  it("is a no-op for repeated activity on the same day", () => {
    const state = stateWithStreak(3, 5, NOON);
    const next = bumpStreak(state, NOON + 60_000);
    expect(next).toBe(state);
  });

  it("increments on consecutive days and tracks the longest streak", () => {
    const state = stateWithStreak(5, 5, NOON);
    const next = bumpStreak(state, NOON + DAY_MS);
    expect(next.streak).toEqual({ days: 6, longestDays: 6, lastActivityDay: dayKey(NOON + DAY_MS) });
  });

  it("keeps a longer historical record when continuing a shorter streak", () => {
    const state = stateWithStreak(2, 9, NOON);
    const next = bumpStreak(state, NOON + DAY_MS);
    expect(next.streak?.days).toBe(3);
    expect(next.streak?.longestDays).toBe(9);
  });

  it("resets to 1 after skipping a day", () => {
    const state = stateWithStreak(7, 7, NOON);
    const next = bumpStreak(state, NOON + 2 * DAY_MS);
    expect(next.streak).toEqual({ days: 1, longestDays: 7, lastActivityDay: dayKey(NOON + 2 * DAY_MS) });
  });

  it("counts day boundaries, not 24h windows (23:50 → 00:10 is consecutive)", () => {
    const lateNight = new Date(2026, 2, 3, 23, 50).getTime();
    const earlyMorning = new Date(2026, 2, 4, 0, 10).getTime();
    const state = stateWithStreak(1, 1, lateNight);
    const next = bumpStreak(state, earlyMorning);
    expect(next.streak?.days).toBe(2);
  });

  it("handles month boundaries", () => {
    const jan31 = new Date(2026, 0, 31, 12).getTime();
    const feb1 = new Date(2026, 1, 1, 12).getTime();
    const next = bumpStreak(stateWithStreak(4, 4, jan31), feb1);
    expect(next.streak?.days).toBe(5);
  });
});

describe("streakStatus", () => {
  it("reports zero and unbroken when no streak exists", () => {
    expect(streakStatus(newState("T", NOON), NOON)).toEqual({ days: 0, broken: false });
  });

  it("reports current days for activity today or yesterday", () => {
    expect(streakStatus(stateWithStreak(4, 4, NOON), NOON)).toEqual({ days: 4, broken: false });
    expect(streakStatus(stateWithStreak(4, 4, NOON), NOON + DAY_MS)).toEqual({ days: 4, broken: false });
  });

  it("reports broken after a missed day", () => {
    expect(streakStatus(stateWithStreak(4, 4, NOON), NOON + 2 * DAY_MS)).toEqual({ days: 0, broken: true });
  });
});
