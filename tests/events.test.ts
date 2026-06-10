import { describe, it, expect } from "vitest";
import { computeEvents, snapshotState, withUpdatedView } from "../src/core/events.js";
import { newCreature, newState } from "../src/core/state.js";
import type { Creature, State } from "../src/types.js";

const NOW = 1_700_000_000_000;

function makeCreature(overrides: Partial<Creature> = {}): Creature {
  return { ...newCreature("Pip", NOW), ...overrides };
}

function withView(state: State, snapshotOf: State): State {
  return {
    ...state,
    view: { lastViewedAt: NOW, snapshots: snapshotState(snapshotOf), acknowledgedEventIds: [] },
  };
}

describe("computeEvents", () => {
  it("returns nothing without a view snapshot", () => {
    expect(computeEvents(newState("T", NOW))).toEqual([]);
  });

  it("returns nothing when nothing changed", () => {
    const state = newState("T", NOW);
    expect(computeEvents(withView(state, state))).toEqual([]);
  });

  it("reports a hatched event for creatures missing from the snapshot", () => {
    const before = newState("T", NOW);
    const egg = makeCreature({ name: "Fresh" });
    const after = withView({ ...before, creatures: [...before.creatures, egg] }, before);
    const events = computeEvents(after);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ id: `hatched:${egg.id}`, kind: "hatched" });
  });

  it("reports death exactly once and suppresses further events for that creature", () => {
    const alive = makeCreature({ stage: "adult", klass: "warrior" });
    const before: State = { ...newState("T", NOW), creatures: [alive] };
    const dead: Creature = { ...alive, stage: "dead", diedAt: NOW + 1000, promptsTotal: alive.promptsTotal + 5 };
    const after = withView({ ...before, creatures: [dead] }, before);
    const events = computeEvents(after);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ id: `died:${alive.id}:${NOW + 1000}`, kind: "died" });
  });

  it("reports evolution with the new class", () => {
    const baby = makeCreature({ stage: "baby" });
    const before: State = { ...newState("T", NOW), creatures: [baby] };
    const adult: Creature = { ...baby, stage: "adult", klass: "sage" };
    const after = withView({ ...before, creatures: [adult] }, before);
    const events = computeEvents(after);
    expect(events).toHaveLength(1);
    expect(events[0]?.kind).toBe("evolved");
    expect(events[0]?.text).toContain("baby → adult");
    expect(events[0]?.text).toContain("sage");
  });

  it("reports elder lock", () => {
    const elder = makeCreature({ stage: "elder", klass: "warlord" });
    const before: State = { ...newState("T", NOW), creatures: [elder] };
    const locked: Creature = { ...elder, locked: true };
    const after = withView({ ...before, creatures: [locked] }, before);
    const events = computeEvents(after);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ id: `locked:${elder.id}`, kind: "locked" });
  });

  it("reports prompt and stat deltas", () => {
    const c = makeCreature({ promptsTotal: 10, stats: { str: 2, int: 2, dex: 2 } });
    const before: State = { ...newState("T", NOW), creatures: [c] };
    const grown: Creature = { ...c, promptsTotal: 13, stats: { str: 4, int: 2, dex: 2 } };
    const after = withView({ ...before, creatures: [grown] }, before);
    const events = computeEvents(after);
    expect(events.map((e) => e.kind).sort()).toEqual(["prompts", "stats"]);
    expect(events.find((e) => e.kind === "prompts")?.text).toBe("+3 prompts");
    expect(events.find((e) => e.kind === "stats")?.text).toBe("+2 stats");
  });

  it("ignores decreased stats instead of reporting negative gains", () => {
    const c = makeCreature({ stats: { str: 5, int: 5, dex: 5 } });
    const before: State = { ...newState("T", NOW), creatures: [c] };
    const shrunk: Creature = { ...c, stats: { str: 1, int: 1, dex: 1 } };
    const after = withView({ ...before, creatures: [shrunk] }, before);
    expect(computeEvents(after)).toEqual([]);
  });
});

describe("withUpdatedView", () => {
  it("snapshots all creatures and preserves acknowledged ids", () => {
    const state: State = {
      ...newState("T", NOW),
      view: { lastViewedAt: 0, snapshots: {}, acknowledgedEventIds: ["a", "b"] },
    };
    const next = withUpdatedView(state, NOW + 5000);
    expect(next.view?.lastViewedAt).toBe(NOW + 5000);
    expect(Object.keys(next.view?.snapshots ?? {})).toEqual(state.creatures.map((c) => c.id));
    expect(next.view?.acknowledgedEventIds).toEqual(["a", "b"]);
  });
});
