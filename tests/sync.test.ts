import { describe, it, expect } from "vitest";
import { newState } from "../src/core/state.js";
import { buildSyncBody, shouldSyncNow } from "../src/core/sync.js";
import { SYNC_THROTTLE_MS, type State } from "../src/types.js";

describe("buildSyncBody", () => {
  it("flattens all creatures into the wire format", () => {
    const s = newState("Plucky Pickle", 1_500_000_000_000);
    const body = buildSyncBody(s);
    expect(body.creatures).toHaveLength(1);
    expect(body.creatures[0]?.name).toBe("Plucky Pickle");
    expect(body.creatures[0]?.stage).toBe("egg");
    expect(body.creatures[0]?.locked).toBe(false);
    expect(body.creatures[0]?.id).toBeDefined();
  });
});

describe("shouldSyncNow", () => {
  const baseState = (overrides: Partial<State> = {}): State => ({
    ...newState("Test", 1_000_000_000_000),
    ...overrides,
  });

  it("never syncs in local mode", () => {
    expect(shouldSyncNow(baseState({ mode: "local", cloud: null }), Date.now())).toBe(false);
  });

  it("syncs first time when no lastSyncAt", () => {
    const s = baseState({
      mode: "multiplayer",
      cloud: { serverUrl: "x", token: "x", userId: "x", username: null, lastSyncAt: null, lastSyncError: null },
    });
    expect(shouldSyncNow(s, Date.now())).toBe(true);
  });

  it("throttles within window", () => {
    const now = 2_000_000_000_000;
    const s = baseState({
      mode: "multiplayer",
      cloud: { serverUrl: "x", token: "x", userId: "x", username: null, lastSyncAt: now - 1000, lastSyncError: null },
    });
    expect(shouldSyncNow(s, now)).toBe(false);
  });

  it("allows sync after throttle window", () => {
    const now = 2_000_000_000_000;
    const s = baseState({
      mode: "multiplayer",
      cloud: { serverUrl: "x", token: "x", userId: "x", username: null, lastSyncAt: now - SYNC_THROTTLE_MS - 1, lastSyncError: null },
    });
    expect(shouldSyncNow(s, now)).toBe(true);
  });
});
