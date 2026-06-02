import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync, openSync, closeSync, unlinkSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
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
  const parsed = JSON.parse(raw) as State | LegacyStateV1 | LegacyStateV2;

  if (parsed.version === 3) return parsed;
  if (parsed.version === 2) return migrateV2ToV3(parsed);
  if (parsed.version === 1) return migrateV2ToV3(migrateV1ToV2(parsed));
  throw new Error(`Unsupported state version: ${(parsed as { version: number }).version}`);
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
  writeFileSync(tmp, JSON.stringify(state, null, 2), "utf8");
  renameSync(tmp, path);
}

export function loadOrInit(name: string = generateName(), path: string = getStatePath()): State {
  return loadState(path) ?? newState(name);
}

const LOCK_STALE_MS = 5_000;
const LOCK_RETRY_MS = 20;
const LOCK_TIMEOUT_MS = 5_000;

function sleepSync(ms: number): void {
  // Block this (short-lived) hook process briefly without busy-spinning the CPU.
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Run `fn` while holding an exclusive lock on the state file, so concurrent
 * Claude Code hooks (a prompt and a tool firing at once) can't clobber each
 * other's read-modify-write. Keep `fn` synchronous and short — never await
 * inside it. A crashed holder's lock is reclaimed once it goes stale.
 */
export function withStateLock<T>(fn: () => T, path: string = getStatePath()): T {
  mkdirSync(dirname(path), { recursive: true });
  const lockPath = `${path}.lock`;
  const start = Date.now();
  let fd: number | null = null;
  for (;;) {
    try {
      fd = openSync(lockPath, "wx");
      break;
    } catch {
      let stale = false;
      try {
        stale = Date.now() - statSync(lockPath).mtimeMs > LOCK_STALE_MS;
      } catch {
        continue; // lock vanished between open and stat — retry immediately
      }
      if (stale || Date.now() - start > LOCK_TIMEOUT_MS) {
        try {
          unlinkSync(lockPath);
        } catch {
          /* someone else reclaimed it */
        }
        continue;
      }
      sleepSync(LOCK_RETRY_MS);
    }
  }
  try {
    return fn();
  } finally {
    try {
      closeSync(fd);
    } catch {
      /* already closed */
    }
    try {
      unlinkSync(lockPath);
    } catch {
      /* already removed */
    }
  }
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
