import {
  closeSync,
  copyFileSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";
import { HUNGER_START, type Creature, type State, type Stage, type ClassName } from "../types.js";

interface LegacyCreatureV1V2 {
  name: string;
  stage: Stage;
  klass: ClassName | null;
  stats: { str: number; int: number; dex: number };
  hunger: number;
  promptsTotal: number;
  promptsThisStage: number;
  bornAt: number;
  lastFedAt: number;
  lastSeenAt: number;
  diedAt: number | null;
}

interface LegacyStateV1 {
  version: 1;
  creature: LegacyCreatureV1V2;
  history: { evolutions: Array<{ at: number; from: Stage; to: Stage; klass?: ClassName }>; deaths: number; rebirths: number };
}

interface LegacyStateV2 {
  version: 2;
  mode: State["mode"];
  cloud: State["cloud"];
  creature: LegacyCreatureV1V2;
  history: LegacyStateV1["history"];
}

export function getStatePath(): string {
  if (process.env.CODETAMA_STATE_FILE) return process.env.CODETAMA_STATE_FILE;
  return join(homedir(), ".codetama", "state.json");
}

export function generateName(): string {
  const adj = [
    "Plucky",
    "Grumpy",
    "Snappy",
    "Wibbly",
    "Cosmic",
    "Tiny",
    "Mighty",
    "Sneaky",
    "Brave",
    "Curious",
  ] as const;
  const noun = [
    "Janet",
    "Pip",
    "Bork",
    "Ziggy",
    "Tofu",
    "Gizmo",
    "Mochi",
    "Bean",
    "Pickle",
    "Noodle",
  ] as const;
  const a = adj[Math.floor(Math.random() * adj.length)] ?? "Plucky";
  const n = noun[Math.floor(Math.random() * noun.length)] ?? "Janet";
  return `${a} ${n}`;
}

export function newCreature(name: string, now: number = Date.now()): Creature {
  return {
    id: randomUUID(),
    name,
    stage: "egg",
    klass: null,
    stats: { str: 1, int: 1, dex: 1 },
    hunger: HUNGER_START,
    promptsTotal: 0,
    promptsThisStage: 0,
    bornAt: now,
    lastFedAt: now,
    lastSeenAt: now,
    diedAt: null,
    locked: false,
  };
}

export function newState(name: string, now: number = Date.now()): State {
  return {
    version: 3,
    mode: "local",
    cloud: null,
    creatures: [newCreature(name, now)],
    history: { evolutions: [], deaths: 0, rebirths: 0 },
  };
}

export function loadState(path: string = getStatePath()): State | null {
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf8");
  try {
    return parseState(raw);
  } catch (e) {
    if (!(e instanceof SyntaxError)) throw e;
    return recoverState(path);
  }
}

function parseState(raw: string): State {
  const parsed = JSON.parse(raw) as State | LegacyStateV1 | LegacyStateV2 | null;
  if (parsed === null || typeof parsed !== "object") {
    throw new SyntaxError("State file does not contain a JSON object");
  }
  if (parsed.version === 3) return parsed;
  if (parsed.version === 2) return migrateV2ToV3(parsed);
  if (parsed.version === 1) return migrateV2ToV3(migrateV1ToV2(parsed));
  throw new Error(`Unsupported state version: ${(parsed as { version: number }).version}`);
}

/**
 * The state file can end up unparseable after a crash or power loss mid-save
 * (most commonly observed on Windows, where the file survives with its size
 * intact but zeroed content). Hook commands run on every tool call, so a
 * corrupt file would otherwise crash-loop forever. Fall back to the newest
 * parseable `<state>.<pid>.tmp` snapshot left behind by an interrupted save;
 * the corrupt original is kept next to the state file for inspection.
 */
function recoverState(path: string): State | null {
  try {
    copyFileSync(path, `${path}.corrupt.bak`);
  } catch {
    // Preserving the corrupt file is best-effort; recovery matters more.
  }

  const dir = dirname(path);
  const base = basename(path);
  const snapshots: Array<{ file: string; mtimeMs: number }> = [];
  for (const name of readdirSync(dir)) {
    if (!name.startsWith(`${base}.`) || !name.endsWith(".tmp")) continue;
    const file = join(dir, name);
    try {
      snapshots.push({ file, mtimeMs: statSync(file).mtimeMs });
    } catch {
      // A concurrent save may rename its snapshot away between readdir and stat.
    }
  }
  snapshots.sort((a, b) => b.mtimeMs - a.mtimeMs);

  for (const { file } of snapshots) {
    let state: State;
    try {
      state = parseState(readFileSync(file, "utf8"));
    } catch {
      continue;
    }
    saveState(state, path);
    return state;
  }
  return null;
}

function migrateV1ToV2(old: LegacyStateV1): LegacyStateV2 {
  return {
    version: 2,
    mode: "local",
    cloud: null,
    creature: old.creature,
    history: old.history,
  };
}

function migrateV2ToV3(old: LegacyStateV2): State {
  const c = old.creature;
  const newC: Creature = { ...c, id: randomUUID(), locked: false };
  return {
    version: 3,
    mode: old.mode,
    cloud: old.cloud,
    creatures: [newC],
    history: {
      evolutions: old.history.evolutions.map((e) => ({ ...e, creatureId: newC.id })),
      deaths: old.history.deaths,
      rebirths: old.history.rebirths,
    },
  };
}

export function saveState(state: State, path: string = getStatePath()): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;

  // fsync before the rename, otherwise a crash can leave the renamed file
  // with allocated-but-unwritten (zeroed) content on some filesystems.
  const fd = openSync(tmp, "w");
  try {
    writeSync(fd, JSON.stringify(state, null, 2));
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }

  try {
    renameWithRetry(tmp, path);
  } catch (e) {
    rmSync(tmp, { force: true });
    throw e;
  }
}

const RENAME_ATTEMPTS = 10;

/**
 * Hook invocations run concurrently (one per tool call in a batch), and on
 * Windows renaming over a file another process briefly holds open fails with
 * EPERM/EACCES/EBUSY. Those are transient, so retry with a short backoff.
 */
function renameWithRetry(from: string, to: string): void {
  for (let attempt = 1; ; attempt++) {
    try {
      renameSync(from, to);
      return;
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      const transient = code === "EPERM" || code === "EACCES" || code === "EBUSY";
      if (!transient || attempt >= RENAME_ATTEMPTS) throw e;
      sleepSync(attempt * 5);
    }
  }
}

function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function loadOrInit(name: string = generateName(), path: string = getStatePath()): State {
  return loadState(path) ?? newState(name);
}

export function activeCreature(state: State): Creature | null {
  const candidates = state.creatures.filter((c) => c.stage !== "dead" && !c.locked);
  if (candidates.length === 0) return null;
  return candidates[candidates.length - 1] ?? null;
}

export function findCreature(state: State, id: string): Creature | null {
  return state.creatures.find((c) => c.id === id) ?? null;
}

export function replaceCreature(state: State, id: string, next: Creature): State {
  return {
    ...state,
    creatures: state.creatures.map((c) => (c.id === id ? next : c)),
  };
}
