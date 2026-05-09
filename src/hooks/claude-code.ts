import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

export const HOOK_MARKER = "codetama";

interface HookCommand {
  type: "command";
  command: string;
}

interface HookMatcher {
  matcher?: string;
  hooks: HookCommand[];
}

interface ClaudeSettings {
  hooks?: Record<string, HookMatcher[]>;
  [key: string]: unknown;
}

export function getClaudeSettingsPath(): string {
  if (process.env.CLAUDE_SETTINGS_FILE) return process.env.CLAUDE_SETTINGS_FILE;
  return join(homedir(), ".claude", "settings.json");
}

export function readSettings(path: string = getClaudeSettingsPath()): ClaudeSettings {
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, "utf8").trim();
  if (raw === "") return {};
  return JSON.parse(raw) as ClaudeSettings;
}

export function writeSettings(settings: ClaudeSettings, path: string = getClaudeSettingsPath()): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(settings, null, 2), "utf8");
  renameSync(tmp, path);
}

export function buildHookCommands(): {
  userPromptSubmit: HookMatcher;
  postToolUse: HookMatcher;
} {
  const cmd: HookCommand = {
    type: "command",
    command: `codetama --feed #${HOOK_MARKER}`,
  };

  return {
    userPromptSubmit: { hooks: [cmd] },
    postToolUse: { matcher: "*", hooks: [cmd] },
  };
}

function isOurHook(matcher: HookMatcher): boolean {
  return matcher.hooks.some((h) => h.command.includes(`#${HOOK_MARKER}`));
}

export function installHooks(path: string = getClaudeSettingsPath()): { added: number } {
  const settings = readSettings(path);
  const hooks = settings.hooks ?? {};
  const ours = buildHookCommands();
  let added = 0;

  const upsert = (eventName: string, entries: HookMatcher[]): HookMatcher[] => {
    const existing = (hooks[eventName] ?? []).filter((m) => !isOurHook(m));
    return [...existing, ...entries];
  };

  hooks["UserPromptSubmit"] = upsert("UserPromptSubmit", [ours.userPromptSubmit]);
  hooks["PostToolUse"] = upsert("PostToolUse", [ours.postToolUse]);
  added = 2;

  settings.hooks = hooks;
  writeSettings(settings, path);
  return { added };
}

export function uninstallHooks(path: string = getClaudeSettingsPath()): { removed: number } {
  const settings = readSettings(path);
  const hooks = settings.hooks;
  if (!hooks) return { removed: 0 };

  let removed = 0;
  for (const eventName of Object.keys(hooks)) {
    const before = hooks[eventName];
    if (!before) continue;
    const after = before.filter((m) => !isOurHook(m));
    removed += before.length - after.length;
    if (after.length === 0) {
      delete hooks[eventName];
    } else {
      hooks[eventName] = after;
    }
  }

  if (Object.keys(hooks).length === 0) {
    delete settings.hooks;
  }
  writeSettings(settings, path);
  return { removed };
}

export function isInstalled(path: string = getClaudeSettingsPath()): boolean {
  const settings = readSettings(path);
  if (!settings.hooks) return false;
  for (const eventName of Object.keys(settings.hooks)) {
    const matchers = settings.hooks[eventName];
    if (!matchers) continue;
    if (matchers.some(isOurHook)) return true;
  }
  return false;
}
