import { activeCreature, loadOrInit, replaceCreature, saveState } from "../core/state.js";

const MAX_NAME_LEN = 32;

export function runRename(rawName: string): void {
  const name = rawName.trim();
  if (!name) {
    process.stderr.write("usage: codetama --rename <new name>\n");
    process.exit(1);
  }
  if (name.length > MAX_NAME_LEN) {
    process.stderr.write(`name too long (max ${MAX_NAME_LEN} characters)\n`);
    process.exit(1);
  }

  const state = loadOrInit();
  const creature = activeCreature(state);
  if (!creature) {
    process.stderr.write("no active creature to rename\n");
    process.exit(1);
  }

  const old = creature.name;
  if (old === name) {
    process.stdout.write(`already named "${name}".\n`);
    return;
  }

  const next = replaceCreature(state, creature.id, { ...creature, name });
  saveState(next);

  process.stdout.write(`renamed: ${old} → ${name}\n`);
}
