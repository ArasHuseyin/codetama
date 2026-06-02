import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TOOL_TO_FOOD, mapPayloadToFood, applyFeed, runFeed } from "../src/commands/feed.js";
import { loadOrInit, newState, saveState } from "../src/core/state.js";

describe("mapPayloadToFood", () => {
  it("maps a prompt submission to prompt food", () => {
    expect(mapPayloadToFood({ hook_event_name: "UserPromptSubmit" })).toBe("prompt");
  });

  it("maps known tools to their food type", () => {
    expect(mapPayloadToFood({ hook_event_name: "PostToolUse", tool_name: "Bash" })).toBe("bash");
    expect(mapPayloadToFood({ hook_event_name: "PostToolUse", tool_name: "Read" })).toBe("read");
    expect(mapPayloadToFood({ hook_event_name: "PostToolUse", tool_name: "Edit" })).toBe("edit");
    expect(mapPayloadToFood({ hook_event_name: "PostToolUse", tool_name: "WebSearch" })).toBe("web");
  });

  it("returns null for unknown tools and unknown events", () => {
    expect(mapPayloadToFood({ hook_event_name: "PostToolUse", tool_name: "TotallyNewTool" })).toBeNull();
    expect(mapPayloadToFood({ hook_event_name: "SessionStart" })).toBeNull();
    expect(mapPayloadToFood({})).toBeNull();
  });

  it("covers every core Claude Code tool that should feed the creature", () => {
    // If Claude Code adds/renames a tool, update TOOL_TO_FOOD so the creature
    // keeps being fed. This guards against silent regressions.
    const expected = ["Bash", "Read", "Grep", "Glob", "Edit", "Write", "MultiEdit", "WebFetch", "WebSearch"];
    for (const tool of expected) {
      expect(TOOL_TO_FOOD[tool], `tool ${tool} should map to a food type`).toBeDefined();
    }
  });
});

describe("applyFeed (pipeline)", () => {
  it("a prompt advances stage progress and raises hunger", () => {
    const t0 = 1_700_000_000_000;
    const start = newState("Test", t0);
    const before = start.creatures[0]!;
    const { state } = applyFeed(start, "prompt", t0 + 1000);
    const after = state.creatures[0]!;
    expect(after.promptsThisStage).toBe(before.promptsThisStage + 1);
    expect(after.promptsTotal).toBe(before.promptsTotal + 1);
    expect(after.hunger).toBeGreaterThan(before.hunger);
  });

  it("a prompt bumps the daily streak; a tool does not", () => {
    const t0 = 1_700_000_000_000;
    const start = newState("Test", t0);
    const prompted = applyFeed(start, "prompt", t0).state;
    expect(prompted.streak?.days).toBe(1);

    const toolOnly = applyFeed(newState("Test", t0), "bash", t0).state;
    expect(toolOnly.streak).toBeUndefined();
  });

  it("enough prompts hatch the egg into a baby", () => {
    let s = newState("Test", 1_700_000_000_000);
    let t = 1_700_000_000_000;
    for (let i = 0; i < 6; i++) {
      t += 1000;
      s = applyFeed(s, "prompt", t).state;
    }
    expect(s.creatures[0]!.stage).toBe("baby");
  });
});

describe("runFeed (end-to-end with state file)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "codetama-feed-"));
    process.env.CODETAMA_STATE_FILE = join(dir, "state.json");
  });

  afterEach(() => {
    delete process.env.CODETAMA_STATE_FILE;
    rmSync(dir, { recursive: true, force: true });
  });

  it("loads, feeds, and persists state for a prompt hook", async () => {
    // Seed with a fresh creature (now) so it isn't starved by real-clock decay.
    saveState(newState("Pixel", Date.now()));

    await runFeed({ hook_event_name: "UserPromptSubmit" });

    const after = loadOrInit();
    expect(after.creatures[0]!.promptsTotal).toBe(1);
    expect(after.streak?.days).toBe(1);
  });

  it("persists a tool feed without touching the streak", async () => {
    saveState(newState("Pixel", Date.now()));

    await runFeed({ hook_event_name: "PostToolUse", tool_name: "Read" });

    const after = loadOrInit();
    expect(after.creatures[0]!.promptsTotal).toBe(0);
    expect(after.streak).toBeUndefined();
  });

  it("is a no-op for an unrecognized hook payload", async () => {
    saveState(newState("Pixel", Date.now()));

    await runFeed({ hook_event_name: "SessionStart" });

    const after = loadOrInit();
    expect(after.creatures[0]!.promptsTotal).toBe(0);
  });
});
