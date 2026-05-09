import { existsSync } from "node:fs";
import { applyDecayAll } from "../core/hunger.js";
import { isInstalled } from "../hooks/claude-code.js";
import { getStatePath, loadOrInit, saveState } from "../core/state.js";
import { renderState } from "../render/creature-box.js";
import { computeEvents, withUpdatedView } from "../core/events.js";
import { renderBigEventBanner, renderEventLine, renderRemoteEvents } from "../render/events.js";

const WELCOME = `
   .-""-.
  /  .-. \\
 |  / o \\ |    Welcome to Codetama.
 |  \\___/ |    Your first egg is ready.
  \\      /
   '----'

  Next steps:
   1. Run  codetama --install   to wire up Claude Code hooks
   2. Code as usual — every prompt feeds your creature
   3. Run  codetama --view      to watch it live

  More: https://codetama.com
`;

interface RunCreatureOptions {
  watch?: boolean;
}

const WATCH_INTERVAL_MS = 5000;

export function runCreature(options: RunCreatureOptions = {}): void {
  if (options.watch) {
    runWatch();
    return;
  }
  renderOnce();
}

function renderOnce(): void {
  const now = Date.now();
  const isFirstRun = !existsSync(getStatePath());
  const state = loadOrInit();
  const decayed = applyDecayAll(state, now);

  const events = computeEvents(decayed);
  const banner = renderBigEventBanner(events);
  const eventLine = renderEventLine(events);
  const remoteLines = renderRemoteEvents(decayed.remoteEvents ?? []);

  const updated = withUpdatedView(decayed, now);
  const remoteAcked = (updated.remoteEvents ?? []).map((e) => ({ ...e, shown: true }));
  const finalState = remoteAcked.length > 0 ? { ...updated, remoteEvents: remoteAcked } : updated;
  saveState(finalState);

  if (isFirstRun) {
    process.stdout.write(WELCOME + "\n");
  }
  if (banner) {
    process.stdout.write(banner + "\n");
  }
  if (remoteLines) {
    process.stdout.write(remoteLines + "\n\n");
  }
  if (eventLine) {
    process.stdout.write(eventLine + "\n\n");
  }
  process.stdout.write(renderState(finalState, now) + "\n");

  if (isFirstRun && !isInstalled()) {
    process.stdout.write(`\n  hint: hooks not installed yet. run  \`codetama --install\`  to start feeding automatically.\n`);
  }
}

function runWatch(): void {
  function tick(): void {
    process.stdout.write("\x1b[2J\x1b[H");
    renderOnce();
    process.stdout.write(`\n  \x1b[2mauto-refresh every ${Math.round(WATCH_INTERVAL_MS / 1000)}s — Ctrl+C to quit\x1b[22m\n`);
  }

  tick();
  const handle = setInterval(tick, WATCH_INTERVAL_MS);
  process.on("SIGINT", () => {
    clearInterval(handle);
    process.stdout.write("\n");
    process.exit(0);
  });
}
