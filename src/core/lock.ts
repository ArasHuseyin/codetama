import { mkdirSync, rmdirSync, statSync } from "node:fs";
import { dirname } from "node:path";

/** Locks older than this are assumed to belong to a crashed process. */
const STALE_LOCK_MS = 10_000;
/** Give up waiting after this long; proceeding unlocked beats dropping a feed. */
const MAX_WAIT_MS = 2_000;
const RETRY_DELAY_MS = 25;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Advisory file lock around a read-modify-write of `targetPath`.
 *
 * Claude Code can run several tool calls in parallel, so multiple `--feed`
 * hook processes may race on the state file; without a lock, the last writer
 * silently discards the others' feeds. `mkdir` of `<target>.lock` is atomic
 * on all platforms, which makes it a portable mutex without native deps.
 */
export async function withFileLock<T>(targetPath: string, fn: () => T | Promise<T>): Promise<T> {
  const lockDir = `${targetPath}.lock`;
  mkdirSync(dirname(targetPath), { recursive: true });

  const deadline = Date.now() + MAX_WAIT_MS;
  let acquired = false;
  while (!acquired) {
    try {
      mkdirSync(lockDir);
      acquired = true;
    } catch {
      try {
        if (Date.now() - statSync(lockDir).mtimeMs > STALE_LOCK_MS) {
          rmdirSync(lockDir);
          continue;
        }
      } catch {
        continue; // lock vanished between mkdir and stat — try again immediately
      }
      if (Date.now() >= deadline) break;
      await sleep(RETRY_DELAY_MS);
    }
  }

  try {
    return await fn();
  } finally {
    if (acquired) {
      try {
        rmdirSync(lockDir);
      } catch {
        // already removed (e.g. stolen as stale) — nothing to clean up
      }
    }
  }
}
