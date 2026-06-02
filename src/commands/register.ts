import { createInterface } from "node:readline/promises";
import { loadOrInit, saveState, withStateLock } from "../core/state.js";
import { getServerUrl, pushSync, validateToken } from "../core/sync.js";
import { openBrowser } from "../util/open-browser.js";
import type { State } from "../types.js";

/**
 * Pure: produce the multiplayer state for a freshly validated token. Keeps the
 * existing creatures/history; only flips the mode and attaches cloud config.
 */
export function buildRegisteredState(
  state: State,
  serverUrl: string,
  token: string,
  user: { id: string; name: string | null },
): State {
  return {
    ...state,
    mode: "multiplayer",
    cloud: {
      serverUrl,
      token,
      userId: user.id,
      username: user.name,
      lastSyncAt: null,
      lastSyncError: null,
    },
  };
}

export async function runRegister(): Promise<void> {
  const state = loadOrInit();
  const serverUrl = getServerUrl(state);

  process.stdout.write(`Opening ${serverUrl}/profile in your browser...\n`);
  process.stdout.write(`Sign in with GitHub, generate a token, then paste it here.\n\n`);
  openBrowser(`${serverUrl}/profile`);

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const token = (await rl.question("Token: ")).trim();
  rl.close();

  if (!token) {
    process.stderr.write("No token entered. Aborted.\n");
    process.exit(1);
  }

  process.stdout.write("Validating...\n");
  const result = await validateToken(serverUrl, token);
  if ("error" in result) {
    process.stderr.write(`Failed: ${result.error}\n`);
    process.exit(1);
  }

  const next = withStateLock(() => {
    const latest = loadOrInit();
    const built = buildRegisteredState(latest, serverUrl, token, result.user);
    saveState(built);
    return built;
  });
  process.stdout.write(`✓ Registered as ${result.user.name ?? result.user.id}.\n`);
  process.stdout.write(`  Mode is now: multiplayer\n`);

  // Initial sync — claims a tile on the map and pushes the local creature
  // to the server. Without this the user wouldn't appear on the map until
  // they triggered a hook by prompting in Claude Code.
  process.stdout.write(`  Claiming your tile...\n`);
  const now = Date.now();
  const sync = await pushSync(next, now);
  if (sync.ok) {
    withStateLock(() => {
      const after = loadOrInit();
      if (after.cloud) {
        saveState({
          ...after,
          cloud: { ...after.cloud, lastSyncAt: now, lastSyncError: null },
        });
      }
    });
    process.stdout.write(`✓ Tile claimed. Open ${serverUrl}/map to see your spot.\n`);
  } else {
    process.stdout.write(`  ⚠ initial sync failed: ${sync.error}\n`);
    process.stdout.write(`    Your creature is registered locally and will sync automatically the next\n`);
    process.stdout.write(`    time you submit a prompt in Claude Code.\n`);
  }
}
