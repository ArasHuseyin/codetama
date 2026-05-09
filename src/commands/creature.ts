import { existsSync } from "node:fs";
import { applyDecayAll } from "../core/hunger.js";
import { isInstalled } from "../hooks/claude-code.js";
import { getStatePath, loadOrInit, saveState } from "../core/state.js";
import { renderState } from "../render/creature-box.js";

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

export function runCreature(): void {
  const now = Date.now();
  const isFirstRun = !existsSync(getStatePath());
  const state = loadOrInit();
  const decayed = applyDecayAll(state, now);
  saveState(decayed);

  if (isFirstRun) {
    process.stdout.write(WELCOME + "\n");
  }
  process.stdout.write(renderState(decayed, now) + "\n");

  if (isFirstRun && !isInstalled()) {
    process.stdout.write(`\n  hint: hooks not installed yet. run  \`codetama --install\`  to start feeding automatically.\n`);
  }
}
