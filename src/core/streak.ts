import type { State, StreakState } from "../types.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Day boundaries use UTC so a streak can't break (or double-count) just because
// the user changed timezones between two prompts.
export function dayKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function midnightOf(key: string): number {
  const [y, m, d] = key.split("-").map((s) => Number(s));
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function dayDiff(from: string, to: string): number {
  return Math.round((midnightOf(to) - midnightOf(from)) / MS_PER_DAY);
}

export function bumpStreak(state: State, now: number): State {
  const today = dayKey(now);
  const prev = state.streak;
  let next: StreakState;
  if (!prev) {
    next = { days: 1, longestDays: 1, lastActivityDay: today };
  } else if (prev.lastActivityDay === today) {
    next = prev;
  } else {
    const diff = dayDiff(prev.lastActivityDay, today);
    if (diff === 1) {
      const days = prev.days + 1;
      next = {
        days,
        longestDays: Math.max(prev.longestDays, days),
        lastActivityDay: today,
      };
    } else {
      next = { days: 1, longestDays: Math.max(prev.longestDays, 1), lastActivityDay: today };
    }
  }
  if (next === prev) return state;
  return { ...state, streak: next };
}

export function streakStatus(state: State, now: number): { days: number; broken: boolean } {
  const s = state.streak;
  if (!s) return { days: 0, broken: false };
  const today = dayKey(now);
  if (s.lastActivityDay === today) return { days: s.days, broken: false };
  const diff = dayDiff(s.lastActivityDay, today);
  if (diff === 1) return { days: s.days, broken: false };
  return { days: 0, broken: s.days > 0 };
}
