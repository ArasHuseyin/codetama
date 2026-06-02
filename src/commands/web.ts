import { loadOrInit } from "../core/state.js";
import { getServerUrl } from "../core/sync.js";
import { openBrowser } from "../util/open-browser.js";

export function runWeb(): void {
  const state = loadOrInit();
  const serverUrl = getServerUrl(state);
  const path = state.mode === "multiplayer" && state.cloud?.userId ? `/u/${encodeURIComponent(state.cloud.userId)}` : "/map";
  const url = `${serverUrl}${path}`;
  process.stdout.write(`${url}\n`);
  openBrowser(url);
}
