import { describe, it, expect } from "vitest";
import { applyDecay, feedAll, moodOf } from "../src/core/hunger.js";
import { newCreature } from "../src/core/state.js";
import type { State } from "../src/types.js";

const HOUR = 3_600_000;

function singleState(c: ReturnType<typeof newCreature>): State {
  return {
    version: 3,
    mode: "local",
    cloud: null,
    creatures: [c],
    history: { evolutions: [], deaths: 0, rebirths: 0 },
  };
}

describe("hunger decay", () => {
  it("decays at 3 per hour", () => {
    const t0 = 1_000_000_000_000;
    const c = { ...newCreature("Test", t0), hunger: 100 };
    const after2h = applyDecay(c, t0 + 2 * HOUR);
    expect(after2h.hunger).toBe(94);
  });

  it("does not go below zero", () => {
    const t0 = 1_000_000_000_000;
    const c = { ...newCreature("Test", t0), hunger: 5 };
    const after10h = applyDecay(c, t0 + 10 * HOUR);
    expect(after10h.hunger).toBe(0);
  });

  it("kills creature after 7 days at zero hunger", () => {
    const t0 = 1_000_000_000_000;
    const c = { ...newCreature("Test", t0), hunger: 0, lastFedAt: t0 };
    const after8d = applyDecay(c, t0 + 8 * 24 * HOUR);
    expect(after8d.stage).toBe("dead");
  });

  it("does not kill creature before 7 days", () => {
    const t0 = 1_000_000_000_000;
    const c = { ...newCreature("Test", t0), hunger: 0, lastFedAt: t0 };
    const after6d = applyDecay(c, t0 + 6 * 24 * HOUR);
    expect(after6d.stage).toBe("egg");
    expect(after6d.diedAt).toBeNull();
  });
});

describe("feedAll", () => {
  it("prompt feeds active creature only with prompt counter", () => {
    const t0 = 1_000_000_000_000;
    const elder = { ...newCreature("Elder", t0), stage: "elder" as const, locked: true, hunger: 50 };
    const egg = { ...newCreature("Egg", t0), hunger: 50 };
    const state: State = {
      version: 3,
      mode: "local",
      cloud: null,
      creatures: [elder, egg],
      history: { evolutions: [], deaths: 0, rebirths: 0 },
    };
    const result = feedAll(state, "prompt", t0, egg.id);
    const elderAfter = result.creatures[0]!;
    const eggAfter = result.creatures[1]!;
    expect(elderAfter.hunger).toBe(60);
    expect(elderAfter.promptsThisStage).toBe(0);
    expect(eggAfter.hunger).toBe(60);
    expect(eggAfter.promptsThisStage).toBe(1);
  });

  it("bash tool feeds ALL creatures with hunger and adds to stat buffer", () => {
    const t0 = 1_000_000_000_000;
    const elder = { ...newCreature("Elder", t0), stage: "elder" as const, locked: true };
    const egg = newCreature("Egg", t0);
    const state: State = {
      version: 3,
      mode: "local",
      cloud: null,
      creatures: [elder, egg],
      history: { evolutions: [], deaths: 0, rebirths: 0 },
    };
    const result = feedAll(state, "bash", t0, egg.id);
    // At stat 1 with TOOL_STAT_GAIN=0.5, one feed buffers 0.5 (no full stat yet).
    expect(result.creatures[0]!.stats.str).toBe(1);
    expect(result.creatures[1]!.stats.str).toBe(1);
    expect(result.creatures[0]!.statBuffer?.str).toBeCloseTo(0.5, 5);
    expect(result.creatures[0]!.hunger).toBeCloseTo(54, 0);
    expect(result.creatures[1]!.hunger).toBeCloseTo(54, 0);
  });
});

describe("diminishing returns on stat gain", () => {
  it("gives +1 stat after 2 feeds at base level (stat 1)", () => {
    const t0 = 1_000_000_000_000;
    const c = newCreature("Test", t0);
    let state = singleState(c);
    state = feedAll(state, "bash", t0, c.id);
    expect(state.creatures[0]!.stats.str).toBe(1);
    state = feedAll(state, "bash", t0, c.id);
    expect(state.creatures[0]!.stats.str).toBe(2);
  });

  it("requires 20 feeds at stat 100 (1/sqrt(100) × 0.5 = 0.05/feed)", () => {
    const t0 = 1_000_000_000_000;
    const c = { ...newCreature("Test", t0), stats: { str: 100, int: 1, dex: 1 } };
    let state = singleState(c);
    for (let i = 0; i < 19; i++) {
      state = feedAll(state, "bash", t0, c.id);
    }
    expect(state.creatures[0]!.stats.str).toBe(100);
    state = feedAll(state, "bash", t0, c.id);
    expect(state.creatures[0]!.stats.str).toBe(101);
  });

  it("buffers fractional gains across multiple feeds", () => {
    const t0 = 1_000_000_000_000;
    const c = { ...newCreature("Test", t0), stats: { str: 25, int: 1, dex: 1 } };
    // Stat 25 → gain = 0.5/5 = 0.1/feed → +1 every 10 feeds
    let state = singleState(c);
    for (let i = 0; i < 9; i++) state = feedAll(state, "bash", t0, c.id);
    expect(state.creatures[0]!.stats.str).toBe(25);
    expect(state.creatures[0]!.statBuffer?.str).toBeCloseTo(0.9, 5);
    state = feedAll(state, "bash", t0, c.id);
    expect(state.creatures[0]!.stats.str).toBe(26);
  });

  it("does not affect stats not targeted by the food type", () => {
    const t0 = 1_000_000_000_000;
    const c = { ...newCreature("Test", t0), stats: { str: 100, int: 100, dex: 100 } };
    const result = feedAll(singleState(c), "bash", t0, c.id);
    expect(result.creatures[0]!.stats.int).toBe(100);
    expect(result.creatures[0]!.stats.dex).toBe(100);
  });
});

describe("mood", () => {
  it("hungry below 30", () => {
    expect(moodOf({ ...newCreature("T"), hunger: 25 })).toBe("hungry");
  });
  it("happy above 80", () => {
    expect(moodOf({ ...newCreature("T"), hunger: 90 })).toBe("happy");
  });
  it("dead is sick", () => {
    expect(moodOf({ ...newCreature("T"), stage: "dead" as const })).toBe("sick");
  });
});
