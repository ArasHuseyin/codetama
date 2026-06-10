import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
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

  let parsed: State | LegacyStateV1 | LegacyStateV2;
  try {
    parsed = JSON.parse(raw) as State | LegacyStateV1 | LegacyStateV2;
  } catch {
    quarantineCorruptState(path);
    return null;
  }
  if (parsed === null || typeof parsed !== "object" || typeof parsed.version !== "number") {
    quarantineCorruptState(path);
    return null;
  }

  if (parsed.version === 3) return parsed;
  if (parsed.version === 2) return migrateV2ToV3(parsed);
  if (parsed.version === 1) return migrateV2ToV3(migrateV1ToV2(parsed));
  throw new Error(`Unsupported state version: ${(parsed as { version: number }).version}`);
}

/**
 * A corrupt state file would otherwise crash every hook invocation until the
 * user manually deletes it. Move it aside (never delete — it may be partially
 * recoverable) and let the caller start fresh.
 */
function quarantineCorruptState(path: string): void {
  try {
    const quarantined = `${path}.corrupt-${Date.now()}`;
    renameSync(path, quarantined);
    process.stderr.write(`codetama: state file was corrupt — moved to ${quarantined}, starting fresh\n`);
  } catch {
    // If even the rename fails, fall through; the next save will overwrite.
  }
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
