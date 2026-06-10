// Validation for the CLI sync payload. Everything here is untrusted client
// input: the CLI is open source, so any value can be forged.

export interface SyncCreatureBody {
  id: string;
  name: string;
  stage: "egg" | "baby" | "adult" | "elder" | "dead";
  klass: string | null;
  stats: { str: number; int: number; dex: number };
  hunger: number;
  promptsTotal: number;
  promptsThisStage: number;
  bornAt: number;
  lastFedAt: number;
  diedAt: number | null;
  locked: boolean;
}

const VALID_STAGES = new Set(["egg", "baby", "adult", "elder", "dead"]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Control chars, bidi overrides and zero-width chars: these end up in battle
// logs, the map and the leaderboard, where they can spoof or garble output.
// eslint-disable-next-line no-control-regex
const DISALLOWED_NAME_CHARS = new RegExp(
  "[\\u0000-\\u001f\\u007f-\\u009f\\u200b-\\u200f\\u202a-\\u202e\\u2066-\\u2069\\ufeff]",
  "g",
);

export const NAME_MAX_LENGTH = 64;

export function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

export function isUuid(s: unknown): s is string {
  return typeof s === "string" && UUID_RE.test(s);
}

/** Strips invisible/spoofing characters and collapses whitespace. Returns null if nothing displayable remains. */
export function cleanName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(DISALLOWED_NAME_CHARS, "").replace(/\s+/g, " ").trim();
  if (cleaned.length === 0 || cleaned.length > NAME_MAX_LENGTH) return null;
  return cleaned;
}

export function sanitizeCreature(c: SyncCreatureBody): SyncCreatureBody | string {
  if (!isUuid(c.id)) return "invalid creature id";
  const name = cleanName(c.name);
  if (!name) return "invalid name";
  if (!VALID_STAGES.has(c.stage)) return "invalid stage";
  if (c.klass !== null && typeof c.klass !== "string") return "invalid klass";
  if (typeof c.stats !== "object" || !c.stats) return "invalid stats";
  return {
    id: c.id,
    name,
    stage: c.stage,
    klass: c.klass,
    stats: {
      str: clamp(c.stats.str, 1, 100_000),
      int: clamp(c.stats.int, 1, 100_000),
      dex: clamp(c.stats.dex, 1, 100_000),
    },
    hunger: clamp(c.hunger, 0, 100),
    promptsTotal: clamp(c.promptsTotal, 0, 10_000_000),
    promptsThisStage: clamp(c.promptsThisStage, 0, 10_000_000),
    bornAt: clamp(c.bornAt, 0, Date.now() + 60_000),
    lastFedAt: clamp(c.lastFedAt, 0, Date.now() + 60_000),
    diedAt: c.diedAt === null ? null : clamp(c.diedAt, 0, Date.now() + 60_000),
    locked: Boolean(c.locked),
  };
}

/** Max rebirths a single sync may add on top of the highest previously stored value. */
export const REBIRTHS_MAX_GAIN_PER_SYNC = 10;

/**
 * Rebirths are client-reported; without a cap a single request could claim an
 * arbitrary count. Allow modest growth per sync relative to what the server
 * has already accepted (first sync starts from 0).
 */
export function capRebirths(reported: number, prevMax: number | null): number {
  const ceiling = (prevMax ?? 0) + REBIRTHS_MAX_GAIN_PER_SYNC;
  return clamp(reported, 0, Math.min(ceiling, 1_000_000));
}
