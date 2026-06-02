import { describe, it, expect } from "vitest";
import { TOOL_TO_FOOD, mapPayloadToFood } from "../src/commands/feed.js";

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
