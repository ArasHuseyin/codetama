import { existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import {
  activeCreature,
  generateName,
  getStatePath,
  loadState,
  newState,
  saveState,
} from "../core/state.js";
import type { State } from "../types.js";

export interface ResetPlan {
  state: State;
  keptMultiplayer: boolean;
}

/**
 * Pure: builds the post-reset state from the previous one. A fresh egg is
 * created; multiplayer registration (token/cloud config) is carried over so a
 * reset doesn't log the user out of the server.
 */
export function buildResetState(previous: State | null): ResetPlan {
  const fresh = newState(generateName());
  if (previous?.mode === "multiplayer" && previous.cloud) {
    fresh.mode = "multiplayer";
    fresh.cloud = previous.cloud;
    return { state: fresh, keptMultiplayer: true };
  }
  return { state: fresh, keptMultiplayer: false };
}

export async function runReset(force: boolean): Promise<void> {
  const path = getStatePath();
  const previous = existsSync(path) ? loadState(path) : null;

  if (previous && !force) {
    const active = activeCreature(previous);
    const name = active?.name ?? "your creature";

    if (!process.stdin.isTTY) {
      process.stderr.write(
        `This will delete "${name}" and start a new egg.\n` +
          `Re-run with --reset --force to confirm (no TTY available for a prompt).\n`,
      );
      process.exit(1);
    }

    process.stderr.write(`This will permanently delete "${name}" and start a new egg.\n`);
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    const answer = (await rl.question(`Type the creature's name to confirm: `)).trim();
    rl.close();

    if (answer !== name) {
      process.stderr.write(`Name did not match. Aborted — nothing was deleted.\n`);
      process.exit(1);
    }
  }

  const { state: fresh, keptMultiplayer } = buildResetState(previous);

  if (keptMultiplayer && previous?.cloud) {
    process.stdout.write(
      `A new egg has appeared. Multiplayer registration kept (@${previous.cloud.username ?? previous.cloud.userId.slice(0, 8)}).\n` +
        `On your next prompt the old creature will be retired on the server.\n`,
    );
  } else {
    process.stdout.write(`A new egg has appeared. Run \`codetama --creature\` to see it.\n`);
  }

  saveState(fresh);
}
