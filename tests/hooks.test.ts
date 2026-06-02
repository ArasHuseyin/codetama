import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readSettings, installHooks, isInstalled, uninstallHooks } from "../src/hooks/claude-code.js";

const dirs: string[] = [];
function tmpSettings(contents: string): string {
  const dir = mkdtempSync(join(tmpdir(), "codetama-hooks-"));
  dirs.push(dir);
  const path = join(dir, "settings.json");
  writeFileSync(path, contents, "utf8");
  return path;
}

afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("readSettings", () => {
  it("returns {} for a missing file", () => {
    expect(readSettings(join(tmpdir(), "does-not-exist-codetama.json"))).toEqual({});
  });

  it("returns {} for an empty file", () => {
    expect(readSettings(tmpSettings("   "))).toEqual({});
  });

  it("throws a helpful error on malformed JSON instead of crashing opaquely", () => {
    const path = tmpSettings("{ not valid json");
    expect(() => readSettings(path)).toThrow(/Failed to parse Claude settings/);
  });
});

describe("install/uninstall round-trip", () => {
  it("installs hooks, reports installed, then removes them cleanly", () => {
    const path = tmpSettings("{}");
    installHooks(path);
    expect(isInstalled(path)).toBe(true);
    const { removed } = uninstallHooks(path);
    expect(removed).toBe(2);
    expect(isInstalled(path)).toBe(false);
  });
});
