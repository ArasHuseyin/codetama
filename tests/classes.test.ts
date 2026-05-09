import { describe, it, expect } from "vitest";
import { determineClass, pathProbabilities, rankedPaths } from "../src/core/classes.js";

describe("class determination", () => {
  it("STR dominant → warrior", () => {
    expect(determineClass({ str: 50, int: 5, dex: 5 })).toBe("warrior");
  });

  it("INT dominant → sage", () => {
    expect(determineClass({ str: 5, int: 50, dex: 5 })).toBe("sage");
  });

  it("DEX dominant → trickster", () => {
    expect(determineClass({ str: 5, int: 5, dex: 50 })).toBe("trickster");
  });

  it("all equal → balanced", () => {
    expect(determineClass({ str: 10, int: 10, dex: 10 })).toBe("balanced");
  });

  it("within 25% → balanced (low)", () => {
    expect(determineClass({ str: 10, int: 10, dex: 12 })).toBe("balanced");
  });

  it("at 25% boundary → balanced", () => {
    expect(determineClass({ str: 12, int: 10, dex: 12 })).toBe("balanced");
  });

  it("just over 25% → not balanced", () => {
    expect(determineClass({ str: 10, int: 10, dex: 13 })).toBe("trickster");
  });

  it("scales with stat level", () => {
    expect(determineClass({ str: 50, int: 50, dex: 60 })).toBe("balanced");
    expect(determineClass({ str: 50, int: 50, dex: 70 })).toBe("trickster");
  });
});

describe("path probabilities", () => {
  it("uneven stats: dominant class gets highest probability", () => {
    const p = pathProbabilities({ str: 30, int: 5, dex: 5 });
    expect(p.warrior).toBeGreaterThan(p.sage);
    expect(p.warrior).toBeGreaterThan(p.trickster);
  });

  it("balanced stats: balanced wins", () => {
    const p = pathProbabilities({ str: 10, int: 10, dex: 10 });
    expect(p.balanced).toBeGreaterThan(0);
    expect(p.balanced).toBeGreaterThan(p.warrior);
  });

  it("ranked paths sorted descending", () => {
    const ranked = rankedPaths({ str: 30, int: 10, dex: 5 });
    for (let i = 1; i < ranked.length; i++) {
      const prev = ranked[i - 1];
      const cur = ranked[i];
      expect(prev).toBeDefined();
      expect(cur).toBeDefined();
      expect(prev!.pct).toBeGreaterThanOrEqual(cur!.pct);
    }
  });
});
