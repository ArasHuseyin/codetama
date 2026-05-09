import { isInstalled } from "../hooks/claude-code.js";
import { loadOrInit } from "../core/state.js";

const VERSION = "0.1.0";

const HELP = `
  Codetama %VERSION%  ·  a creature that lives in your code
  ─────────────────────────────────────────────────────────────
  --creature           show your creature's current state
  --creature --watch   live-refresh the creature view every 5s
  --view               open the live animated viewer
  --rename <name>      rename your active creature
  --install            install Claude Code hooks (auto-feed)
  --uninstall          remove Claude Code hooks
  --register           link a CLI token from codetama.com
  --local              switch back to local mode (stops cloud sync)
  --web                open your profile / battle map in browser
  --reset --force      hatch a fresh egg (deletes current)
  --help               this help text
  --version            print version

  status:
    mode:    %MODE%
    hooks:   %HOOKS%

  examples:
    codetama --install              # one-time setup
    codetama --view                 # watch your creature live
    codetama --web                  # open the world map
    codetama --register             # opt into multiplayer

  More: https://codetama.com  ·  https://github.com/codetama/codetama
`;

export function runHelp(): void {
  const hooks = isInstalled() ? "installed ✓" : "not installed (run --install)";
  const state = loadOrInit();
  const mode =
    state.mode === "multiplayer" && state.cloud
      ? `multiplayer (as ${state.cloud.username ?? state.cloud.userId})`
      : "local";
  process.stdout.write(
    HELP.replace("%VERSION%", `v${VERSION}`).replace("%HOOKS%", hooks).replace("%MODE%", mode),
  );
}

export function runVersion(): void {
  process.stdout.write(`codetama v${VERSION}\n`);
}
