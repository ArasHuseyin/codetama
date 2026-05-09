import { existsSync } from "node:fs";
import { getStatePath, loadState, newState, saveState, generateName } from "../core/state.js";

export function runReset(force: boolean): void {
  const path = getStatePath();
  if (!force && existsSync(path)) {
    process.stderr.write(
      `This will delete your current creature and start a new egg.\n` +
        `Re-run with --reset --force to confirm.\n`,
    );
    process.exit(1);
  }

  const previous = existsSync(path) ? loadState(path) : null;
  const fresh = newState(generateName());

  if (previous?.mode === "multiplayer" && previous.cloud) {
    fresh.mode = "multiplayer";
    fresh.cloud = previous.cloud;
    process.stdout.write(
      `A new egg has appeared. Multiplayer registration kept (@${previous.cloud.username ?? previous.cloud.userId.slice(0, 8)}).\n` +
        `On your next prompt the old creature will be retired on the server.\n`,
    );
  } else {
    process.stdout.write(`A new egg has appeared. Run \`codetama --creature\` to see it.\n`);
  }

  saveState(fresh);
}
