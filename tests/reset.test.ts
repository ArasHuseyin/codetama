import { describe, it, expect } from "vitest";
import { buildResetState } from "../src/commands/reset.js";
import { newState } from "../src/core/state.js";

describe("buildResetState", () => {
  it("produces a fresh single-egg state from null (no prior state)", () => {
    const { state, keptMultiplayer } = buildResetState(null);
    expect(keptMultiplayer).toBe(false);
    expect(state.creatures).toHaveLength(1);
    expect(state.creatures[0]!.stage).toBe("egg");
    expect(state.mode).toBe("local");
  });

  it("starts a brand-new egg, discarding the previous creature", () => {
    const prev = newState("Old Timer", 1_700_000_000_000);
    prev.creatures[0]!.promptsTotal = 99;
    const { state } = buildResetState(prev);
    expect(state.creatures[0]!.name).not.toBe("Old Timer");
    expect(state.creatures[0]!.promptsTotal).toBe(0);
    expect(state.creatures[0]!.id).not.toBe(prev.creatures[0]!.id);
  });

  it("preserves multiplayer registration across a reset", () => {
    const prev = newState("Old Timer", 1_700_000_000_000);
    prev.mode = "multiplayer";
    prev.cloud = {
      serverUrl: "https://srv",
      token: "tok",
      userId: "user-1",
      username: "Ada",
      lastSyncAt: 123,
      lastSyncError: null,
    };

    const { state, keptMultiplayer } = buildResetState(prev);
    expect(keptMultiplayer).toBe(true);
    expect(state.mode).toBe("multiplayer");
    expect(state.cloud).toEqual(prev.cloud);
  });

  it("does not carry over cloud config when previous was local", () => {
    const prev = newState("Old Timer", 1_700_000_000_000);
    const { state, keptMultiplayer } = buildResetState(prev);
    expect(keptMultiplayer).toBe(false);
    expect(state.cloud).toBeNull();
  });
});
