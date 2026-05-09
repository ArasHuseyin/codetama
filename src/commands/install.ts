import { installHooks, uninstallHooks } from "../hooks/claude-code.js";

export function runInstall(): void {
  const { added } = installHooks();
  process.stdout.write(
    `Installed ${added} Codetama hook${added === 1 ? "" : "s"} into ~/.claude/settings.json.\n` +
      `Your creature will now feed automatically as you use Claude Code.\n`,
  );
}

export function runUninstall(): void {
  const { removed } = uninstallHooks();
  if (removed === 0) {
    process.stdout.write(`No Codetama hooks were installed.\n`);
    return;
  }
  process.stdout.write(`Removed ${removed} Codetama hook${removed === 1 ? "" : "s"} from ~/.claude/settings.json.\n`);
}
