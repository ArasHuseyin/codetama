import { describe, it, expect } from "vitest";
import { capSuspiciousGains } from "./anti-cheat";

const T0 = new Date("2026-01-01T00:00:00Z");
const HOUR = 60 * 60 * 1000;

describe("capSuspiciousGains", () => {
  it("returns incoming as-is when no previous snapshot", () => {
    const r = capSuspiciousGains(null, { str: 100, int: 100, dex: 100 }, T0);
    expect(r.capped).toBe(false);
    expect(r.stats).toEqual({ str: 100, int: 100, dex: 100 });
  });

  it("allows realistic gains within rate", () => {
    const prev = { lastSyncedAt: T0, str: 10, intStat: 10, dex: 10 };
    // 1 hour later: 240 gain allowed. Actual: 50.
    const r = capSuspiciousGains(prev, { str: 30, int: 20, dex: 20 }, new Date(T0.getTime() + HOUR));
    expect(r.capped).toBe(false);
    expect(r.stats).toEqual({ str: 30, int: 20, dex: 20 });
  });

  it("caps suspiciously high gains", () => {
    const prev = { lastSyncedAt: T0, str: 10, intStat: 10, dex: 10 };
    // 1 minute later: 1/60 of 240 ≈ 4 gain allowed. Actual incoming: 600 gain.
    const r = capSuspiciousGains(prev, { str: 200, int: 200, dex: 200 }, new Date(T0.getTime() + 60 * 1000));
    expect(r.capped).toBe(true);
    const totalAfter = r.stats.str + r.stats.int + r.stats.dex;
    expect(totalAfter).toBeLessThanOrEqual(prev.str + prev.intStat + prev.dex + 5);
    expect(r.stats.str).toBeGreaterThanOrEqual(prev.str);
  });

  it("never decreases stats below previous", () => {
    const prev = { lastSyncedAt: T0, str: 50, intStat: 50, dex: 50 };
    const r = capSuspiciousGains(prev, { str: 1000, int: 1000, dex: 1000 }, new Date(T0.getTime() + 60 * 1000));
    expect(r.stats.str).toBeGreaterThanOrEqual(50);
    expect(r.stats.int).toBeGreaterThanOrEqual(50);
    expect(r.stats.dex).toBeGreaterThanOrEqual(50);
  });

  it("handles syncs immediately one after another", () => {
    const prev = { lastSyncedAt: T0, str: 10, intStat: 10, dex: 10 };
    // Same instant — uses MIN_ELAPSED_MS (1 minute) floor.
    const r = capSuspiciousGains(prev, { str: 11, int: 10, dex: 10 }, T0);
    expect(r.capped).toBe(false);
  });
});
