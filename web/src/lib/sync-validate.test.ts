import { describe, it, expect } from "vitest";
import {
  capRebirths,
  cleanName,
  clamp,
  isUuid,
  sanitizeCreature,
  REBIRTHS_MAX_GAIN_PER_SYNC,
  type SyncCreatureBody,
} from "./sync-validate";

function validCreature(overrides: Partial<SyncCreatureBody> = {}): SyncCreatureBody {
  return {
    id: "123e4567-e89b-42d3-a456-426614174000",
    name: "Plucky Janet",
    stage: "adult",
    klass: "warrior",
    stats: { str: 10, int: 5, dex: 5 },
    hunger: 80,
    promptsTotal: 100,
    promptsThisStage: 10,
    bornAt: Date.now() - 86_400_000,
    lastFedAt: Date.now() - 3_600_000,
    diedAt: null,
    locked: false,
    ...overrides,
  };
}

describe("isUuid", () => {
  it("accepts canonical UUIDs", () => {
    expect(isUuid("123e4567-e89b-42d3-a456-426614174000")).toBe(true);
    expect(isUuid("123E4567-E89B-42D3-A456-426614174000")).toBe(true);
  });

  it("rejects non-UUID strings that the old length check let through", () => {
    expect(isUuid("12345678")).toBe(false);
    expect(isUuid("'; drop table creatures; --")).toBe(false);
    expect(isUuid("123e4567e89b42d3a456426614174000")).toBe(false);
    expect(isUuid(42)).toBe(false);
    expect(isUuid(null)).toBe(false);
  });
});

describe("cleanName", () => {
  it("passes ordinary names through", () => {
    expect(cleanName("Plucky Janet")).toBe("Plucky Janet");
    expect(cleanName("Müsli-Bärchen 3")).toBe("Müsli-Bärchen 3");
  });

  it("strips control characters, bidi overrides and zero-width chars", () => {
    expect(cleanName("Evil\u0007Name")).toBe("EvilName");
    expect(cleanName("abc‮def")).toBe("abcdef");
    expect(cleanName("ghost​​name")).toBe("ghostname");
  });

  it("collapses whitespace and trims", () => {
    expect(cleanName("  a \n\t b  ")).toBe("a b");
  });

  it("rejects names that are empty after cleaning, too long, or not strings", () => {
    expect(cleanName("‮​ ")).toBeNull();
    expect(cleanName("x".repeat(65))).toBeNull();
    expect(cleanName(12)).toBeNull();
  });
});

describe("sanitizeCreature", () => {
  it("accepts a valid creature unchanged", () => {
    const c = validCreature();
    expect(sanitizeCreature(c)).toEqual(c);
  });

  it("rejects bad ids, names and stages with an error string", () => {
    expect(sanitizeCreature(validCreature({ id: "nope" }))).toBe("invalid creature id");
    expect(sanitizeCreature(validCreature({ name: "​" }))).toBe("invalid name");
    expect(sanitizeCreature(validCreature({ stage: "god" as "egg" }))).toBe("invalid stage");
  });

  it("clamps out-of-range numbers", () => {
    const out = sanitizeCreature(
      validCreature({ stats: { str: -5, int: 10 ** 9, dex: NaN }, hunger: 400 }),
    );
    expect(out).not.toBeTypeOf("string");
    const c = out as SyncCreatureBody;
    expect(c.stats).toEqual({ str: 1, int: 100_000, dex: 1 });
    expect(c.hunger).toBe(100);
  });

  it("sanitizes the name in place", () => {
    const out = sanitizeCreature(validCreature({ name: " Spooky‮  Pip " })) as SyncCreatureBody;
    expect(out.name).toBe("Spooky Pip");
  });
});

describe("capRebirths", () => {
  it("allows modest growth over the previous maximum", () => {
    expect(capRebirths(7, 5)).toBe(7);
    expect(capRebirths(5 + REBIRTHS_MAX_GAIN_PER_SYNC, 5)).toBe(5 + REBIRTHS_MAX_GAIN_PER_SYNC);
  });

  it("caps a forged jump", () => {
    expect(capRebirths(1_000_000, 5)).toBe(5 + REBIRTHS_MAX_GAIN_PER_SYNC);
    expect(capRebirths(999, null)).toBe(REBIRTHS_MAX_GAIN_PER_SYNC);
  });

  it("never goes negative or non-finite", () => {
    expect(capRebirths(-3, 5)).toBe(0);
    expect(capRebirths(NaN, 5)).toBe(0);
  });
});

describe("clamp", () => {
  it("falls back to the lower bound for non-finite input", () => {
    expect(clamp(NaN, 3, 10)).toBe(3);
    expect(clamp(Infinity, 0, 10)).toBe(0);
  });
});
