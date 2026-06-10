import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, rmSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { withFileLock } from "../src/core/lock.js";

let tmpDir: string;
let target: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "codetama-lock-"));
  target = join(tmpDir, "state.json");
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("withFileLock", () => {
  it("runs the function and returns its value", async () => {
    expect(await withFileLock(target, () => 42)).toBe(42);
  });

  it("removes the lock dir afterwards, also on error", async () => {
    await expect(
      withFileLock(target, () => {
        expect(existsSync(`${target}.lock`)).toBe(true);
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(existsSync(`${target}.lock`)).toBe(false);
  });

  it("serializes concurrent critical sections", async () => {
    const order: string[] = [];
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    await Promise.all([
      withFileLock(target, async () => {
        order.push("a-start");
        await sleep(50);
        order.push("a-end");
      }),
      withFileLock(target, async () => {
        order.push("b-start");
        await sleep(50);
        order.push("b-end");
      }),
    ]);
    const first = order[0]?.charAt(0);
    expect(order).toEqual(
      first === "a" ? ["a-start", "a-end", "b-start", "b-end"] : ["b-start", "b-end", "a-start", "a-end"],
    );
  });

  it("steals a stale lock left behind by a crashed process", async () => {
    const lockDir = `${target}.lock`;
    mkdirSync(lockDir, { recursive: true });
    const past = (Date.now() - 60_000) / 1000;
    utimesSync(lockDir, past, past);

    const start = Date.now();
    expect(await withFileLock(target, () => "ran")).toBe("ran");
    expect(Date.now() - start).toBeLessThan(1000);
  });
});
