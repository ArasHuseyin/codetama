import { describe, it, expect } from "vitest";
import { checkEvolution } from "../src/core/evolution.js";
import { newState } from "../src/core/state.js";

const T0 = 1_000_000_000_000;

describe("evolution", () => {
  it("first egg hatches at 6 prompts", () => {
    const s = newState("T", T0);
    s.creatures[0]!.promptsThisStage = 6;
    const r = checkEvolution(s, T0);
    expect(r.changed).toBe(true);
    expect(r.events[0]?.to).toBe("baby");
  });

  it("subsequent egg hatches at 5 prompts (veteran bonus)", () => {
    const s = newState("T", T0);
    s.history.rebirths = 1;
    s.creatures[0]!.promptsThisStage = 5;
    const r = checkEvolution(s, T0);
    expect(r.changed).toBe(true);
    expect(r.events[0]?.to).toBe("baby");
  });

  it("baby → adult assigns class from stats", () => {
    const s = newState("T", T0);
    const c = s.creatures[0]!;
    c.stage = "baby";
    c.stats = { str: 30, int: 5, dex: 5 };
    c.promptsThisStage = 20;
    const r = checkEvolution(s, T0);
    expect(r.changed).toBe(true);
    expect(r.events[0]?.to).toBe("adult");
    expect(r.events[0]?.klass).toBe("warrior");
  });

  it("adult → elder converts class to subform", () => {
    const s = newState("T", T0);
    const c = s.creatures[0]!;
    c.stage = "adult";
    c.klass = "sage";
    c.promptsThisStage = 30;
    const r = checkEvolution(s, T0);
    expect(r.events[0]?.to).toBe("elder");
    expect(r.events[0]?.klass).toBe("archmage");
  });

  it("elder reaches 40 → locks elder + spawns new egg", () => {
    const s = newState("T", T0);
    const c = s.creatures[0]!;
    c.stage = "elder";
    c.klass = "warlord";
    c.promptsThisStage = 40;
    const r = checkEvolution(s, T0);

    expect(r.changed).toBe(true);
    expect(r.events[0]?.spawnedNewEgg).toBe(true);
    expect(r.state.creatures).toHaveLength(2);
    expect(r.state.creatures[0]!.locked).toBe(true);
    expect(r.state.creatures[0]!.stage).toBe("elder");
    expect(r.state.creatures[1]!.stage).toBe("egg");
    expect(r.state.history.rebirths).toBe(1);
  });

  it("locked elder is not active anymore", () => {
    const s = newState("T", T0);
    const c = s.creatures[0]!;
    c.stage = "elder";
    c.locked = true;
    c.promptsThisStage = 40;
    const r = checkEvolution(s, T0);
    expect(r.changed).toBe(false);
  });

  it("dead creatures do not evolve", () => {
    const s = newState("T", T0);
    s.creatures[0]!.stage = "dead";
    const r = checkEvolution(s, T0);
    expect(r.changed).toBe(false);
  });
});
