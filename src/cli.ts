#!/usr/bin/env node
import { runCreature } from "./commands/creature.js";
import { runFeed } from "./commands/feed.js";
import { runHelp, runVersion } from "./commands/help.js";
import { runInstall, runUninstall } from "./commands/install.js";
import { runReset } from "./commands/reset.js";
import { runStub } from "./commands/stub.js";
import { runView } from "./commands/view.js";
import { runRegister } from "./commands/register.js";
import { runLocal } from "./commands/local.js";
import { runWeb } from "./commands/web.js";

interface ParsedArgs {
  command: string;
  force: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  let command = "help";
  let force = false;

  for (const a of args) {
    if (!a || !a.startsWith("--")) continue;
    const name = a.slice(2);
    if (name === "force") {
      force = true;
    } else if (command === "help") {
      command = name;
    }
  }

  return { command, force };
}

function main(): void {
  const { command, force } = parseArgs(process.argv);

  switch (command) {
    case "creature":
      runCreature();
      return;
    case "feed":
      void runFeed();
      return;
    case "install":
      runInstall();
      return;
    case "uninstall":
      runUninstall();
      return;
    case "reset":
      runReset(force);
      return;
    case "view":
      runView();
      return;
    case "register":
      void runRegister();
      return;
    case "local":
      runLocal();
      return;
    case "web":
      runWeb();
      return;
    case "version":
      runVersion();
      return;
    case "help":
    default:
      runHelp();
      return;
  }
}

main();
