import { loadOrInit, saveState } from "../core/state.js";

export function runLocal(): void {
  const state = loadOrInit();
  if (state.mode === "local") {
    process.stdout.write(`Already in local mode.\n`);
    return;
  }
  const next = { ...state, mode: "local" as const, cloud: null };
  saveState(next);
  process.stdout.write(`✓ Switched to local mode. Cloud sync stopped.\n`);
  process.stdout.write(`  Your CLI token is forgotten locally — revoke it on the website if you want.\n`);
}
