import { createInterface } from "node:readline/promises";
import { spawn } from "node:child_process";
import { loadOrInit, saveState } from "../core/state.js";
import { getServerUrl, validateToken } from "../core/sync.js";

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

  const next = {
    ...state,
    mode: "multiplayer" as const,
    cloud: {
      serverUrl,
      token,
      userId: result.user.id,
      username: result.user.name,
      lastSyncAt: null,
      lastSyncError: null,
    },
  };
  saveState(next);
  process.stdout.write(`✓ Registered as ${result.user.name ?? result.user.id}.\n`);
  process.stdout.write(`  Mode is now: multiplayer\n`);
}

function openBrowser(url: string): void {
  const platform = process.platform;
  try {
    if (platform === "win32") {
      spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
    } else if (platform === "darwin") {
      spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
    } else {
      spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
    }
  } catch {
    // ignore — user can copy/paste from stdout
  }
}
