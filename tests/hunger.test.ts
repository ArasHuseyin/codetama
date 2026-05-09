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

  it("bash tool feeds ALL creatures with hunger AND stat", () => {
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
    expect(result.creatures[0]!.stats.str).toBe(2);
    expect(result.creatures[1]!.stats.str).toBe(2);
    expect(result.creatures[0]!.hunger).toBeCloseTo(54, 0);
    expect(result.creatures[1]!.hunger).toBeCloseTo(54, 0);
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
