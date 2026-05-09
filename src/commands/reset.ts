import { existsSync, unlinkSync } from "node:fs";
import { getStatePath, newState, saveState, generateName } from "../core/state.js";

export function runReset(force: boolean): void {
  const path = getStatePath();
  if (!force && existsSync(path)) {
    process.stderr.write(
      `This will delete your current creature and start a new egg.\n` +
        `Re-run with --reset --force to confirm.\n`,
    );
    process.exit(1);
  }
  if (existsSync(path)) unlinkSync(path);
  const fresh = newState(generateName());
  saveState(fresh);
  process.stdout.write(`A new egg has appeared. Run \`codetama --creature\` to see it.\n`);
}
