import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { activeCreature, loadState, newState, saveState } from "../src/core/state.js";

let tmpDir: string;
let path: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "codetama-test-"));
  path = join(tmpDir, "state.json");
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("state persistence", () => {
  it("loads null when file does not exist", () => {
    expect(loadState(path)).toBeNull();
  });

  it("round-trips state", () => {
    const s = newState("Plucky Janet", 1_000_000_000_000);
    saveState(s, path);
    expect(existsSync(path)).toBe(true);
    expect(loadState(path)).toEqual(s);
  });

  it("rejects unknown version", () => {
    saveState({ ...newState("T"), version: 99 as 3 }, path);
    expect(() => loadState(path)).toThrow(/version/);
  });

  it("quarantines a corrupt file instead of crashing", () => {
    writeFileSync(path, "{ not json at all", "utf8");
    expect(loadState(path)).toBeNull();
    expect(existsSync(path)).toBe(false);
    expect(readdirSync(tmpDir).some((f) => f.startsWith("state.json.corrupt-"))).toBe(true);
  });

  it("quarantines valid JSON that is not a state object", () => {
    writeFileSync(path, JSON.stringify(["not", "a", "state"]), "utf8");
    expect(loadState(path)).toBeNull();
    expect(existsSync(path)).toBe(false);
  });

  it("migrates v1 → v3", () => {
    const v1 = {
      version: 1,
      creature: {
        name: "Old",
        stage: "egg",
        klass: null,
        stats: { str: 1, int: 1, dex: 1 },
        hunger: 50,
        promptsTotal: 0,
        promptsThisStage: 0,
        bornAt: 1,
        lastFedAt: 1,
        lastSeenAt: 1,
        diedAt: null,
      },
      history: { evolutions: [], deaths: 0, rebirths: 0 },
    };
    writeFileSync(path, JSON.stringify(v1), "utf8");
    const loaded = loadState(path);
    expect(loaded?.version).toBe(3);
    expect(loaded?.creatures).toHaveLength(1);
    expect(loaded?.creatures[0]?.name).toBe("Old");
    expect(loaded?.creatures[0]?.locked).toBe(false);
    expect(loaded?.creatures[0]?.id).toBeDefined();
  });

  it("migrates v2 → v3 keeping cloud + mode", () => {
    const v2 = {
      version: 2,
      mode: "multiplayer",
      cloud: { serverUrl: "https://x", token: "t", userId: "u", username: "u", lastSyncAt: null, lastSyncError: null },
      creature: {
        name: "Old",
        stage: "adult",
        klass: "warrior",
        stats: { str: 5, int: 1, dex: 1 },
        hunger: 60,
        promptsTotal: 22,
        promptsThisStage: 2,
        bornAt: 1,
        lastFedAt: 1,
        lastSeenAt: 1,
        diedAt: null,
      },
      history: { evolutions: [], deaths: 0, rebirths: 0 },
    };
    writeFileSync(path, JSON.stringify(v2), "utf8");
    const loaded = loadState(path);
    expect(loaded?.version).toBe(3);
    expect(loaded?.mode).toBe("multiplayer");
    expect(loaded?.cloud?.token).toBe("t");
    expect(loaded?.creatures).toHaveLength(1);
    expect(loaded?.creatures[0]?.klass).toBe("warrior");
  });
});

describe("activeCreature", () => {
  it("returns null when all dead or locked", () => {
    const s = newState("T", 1);
    s.creatures[0]!.stage = "dead";
    expect(activeCreature(s)).toBeNull();
  });

  it("returns the youngest non-locked, non-dead", () => {
    const s = newState("Old", 1);
    s.creatures[0]!.locked = true;
    const newC = { ...s.creatures[0]!, id: "new-id", name: "Young", stage: "egg" as const, locked: false };
    s.creatures.push(newC);
    expect(activeCreature(s)?.id).toBe("new-id");
  });
});
