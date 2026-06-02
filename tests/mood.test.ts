import { describe, it, expect } from "vitest";
import { moodOf } from "../src/core/hunger.js";
import { newState } from "../src/core/state.js";
import type { Creature } from "../src/types.js";

function creature(overrides: Partial<Creature>): Creature {
  const base = newState("T", 0).creatures[0]!;
  return { ...base, ...overrides };
}

describe("moodOf", () => {
  it("is sick when dead or starving", () => {
    expect(moodOf(creature({ stage: "dead" }))).toBe("sick");
    expect(moodOf(creature({ hunger: 5 }))).toBe("sick");
  });

  it("is hungry at low hunger", () => {
    expect(moodOf(creature({ hunger: 25 }))).toBe("hungry");
  });

  it("is grumpy when overworked AND not well-fed", () => {
    expect(moodOf(creature({ promptsThisStage: 31, hunger: 40 }))).toBe("grumpy");
  });

  it("is merely tired when overworked but well-fed", () => {
    expect(moodOf(creature({ promptsThisStage: 31, hunger: 70 }))).toBe("tired");
  });

  it("is happy when well-fed and not overworked", () => {
    expect(moodOf(creature({ hunger: 90, promptsThisStage: 3 }))).toBe("happy");
  });

  it("is content otherwise", () => {
    expect(moodOf(creature({ hunger: 60, promptsThisStage: 3 }))).toBe("content");
  });
});
