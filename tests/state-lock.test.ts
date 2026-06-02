import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { withStateLock } from "../src/core/state.js";

let dir: string;
let statePath: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "codetama-lock-"));
  statePath = join(dir, "state.json");
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("withStateLock", () => {
  it("returns the result of the locked function", () => {
    const out = withStateLock(() => 42, statePath);
    expect(out).toBe(42);
  });

  it("releases the lock file afterwards", () => {
    withStateLock(() => "done", statePath);
    expect(existsSync(`${statePath}.lock`)).toBe(false);
  });

  it("releases the lock even if the function throws", () => {
    expect(() =>
      withStateLock(() => {
        throw new Error("boom");
      }, statePath),
    ).toThrow("boom");
    expect(existsSync(`${statePath}.lock`)).toBe(false);
  });

  it("allows a subsequent acquisition once released", () => {
    withStateLock(() => "first", statePath);
    const second = withStateLock(() => "second", statePath);
    expect(second).toBe("second");
  });
});
