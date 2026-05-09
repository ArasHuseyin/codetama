import { spawn } from "node:child_process";
import { loadOrInit } from "../core/state.js";
import { getServerUrl } from "../core/sync.js";

export function runWeb(): void {
  const state = loadOrInit();
  const serverUrl = getServerUrl(state);
  const path = state.mode === "multiplayer" && state.cloud?.userId ? `/u/${encodeURIComponent(state.cloud.userId)}` : "/map";
  const url = `${serverUrl}${path}`;
  process.stdout.write(`${url}\n`);
  openBrowser(url);
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
    // user can click the link
  }
}
