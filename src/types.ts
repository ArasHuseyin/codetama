export type Stage = "egg" | "baby" | "adult" | "elder" | "dead";

export type ClassName =
  | "warrior"
  | "sage"
  | "trickster"
  | "balanced"
  | "warlord"
  | "archmage"
  | "shadow"
  | "druid";

export type Mood = "happy" | "content" | "hungry" | "tired" | "grumpy" | "sick";

export type FoodType = "prompt" | "bash" | "read" | "edit" | "search" | "web";

export interface Stats {
  str: number;
  int: number;
  dex: number;
}

export interface Creature {
  id: string;
  name: string;
  stage: Stage;
  klass: ClassName | null;
  stats: Stats;
  hunger: number;
  promptsTotal: number;
  promptsThisStage: number;
  bornAt: number;
  lastFedAt: number;
  lastSeenAt: number;
  diedAt: number | null;
  locked: boolean;
}

export type Mode = "local" | "multiplayer";

export interface CloudConfig {
  serverUrl: string;
  token: string;
  userId: string;
  username: string | null;
  lastSyncAt: number | null;
  lastSyncError: string | null;
}

export interface CreatureSnapshot {
  promptsTotal: number;
  stage: Stage;
  statsSum: number;
  hunger: number;
  locked: boolean;
}

export interface ViewState {
  lastViewedAt: number;
  snapshots: Record<string, CreatureSnapshot>;
  acknowledgedEventIds: string[];
}

export interface StreakState {
  days: number;
  longestDays: number;
  lastActivityDay: string;
}

export interface RemoteEvent {
  id: string;
  kind: string;
  payload: unknown;
  createdAt: string;
  shown: boolean;
}

export interface State {
  version: 3;
  mode: Mode;
  cloud: CloudConfig | null;
  creatures: Creature[];
  history: {
    evolutions: Array<{ at: number; creatureId: string; from: Stage; to: Stage; klass?: ClassName }>;
    deaths: number;
    rebirths: number;
  };
  view?: ViewState;
  streak?: StreakState;
  remoteEvents?: RemoteEvent[];
}

export const DEFAULT_SERVER_URL = "https://codetama.com";
export const SYNC_THROTTLE_MS = 5000;

export const HUNGER_MAX = 100;
export const HUNGER_START = 50;
export const HUNGER_DECAY_PER_HOUR = 3;
export const DEATH_AT_ZERO_FOR_HOURS = 7 * 24;

export const PROMPT_HUNGER_GAIN = 10;
export const TOOL_HUNGER_GAIN = 4;
export const TOOL_STAT_GAIN = 1;

export const FOOD_VALUES: Record<FoodType, { hunger: number; stat: keyof Stats | null }> = {
  prompt: { hunger: PROMPT_HUNGER_GAIN, stat: null },
  bash: { hunger: TOOL_HUNGER_GAIN, stat: "str" },
  read: { hunger: TOOL_HUNGER_GAIN, stat: "int" },
  edit: { hunger: TOOL_HUNGER_GAIN, stat: "dex" },
  search: { hunger: TOOL_HUNGER_GAIN, stat: "int" },
  web: { hunger: TOOL_HUNGER_GAIN, stat: "int" },
};

export const STAGE_THRESHOLDS = {
  eggFirst: 6,
  eggSubsequent: 5,
  baby: 20,
  adult: 30,
  elder: 40,
} as const;

export const BALANCED_RATIO = 1.25;

export const TREND_VISIBLE_FROM_PROMPT = 14;

export const ELDER_SUBFORM: Record<"warrior" | "sage" | "trickster" | "balanced", ClassName> = {
  warrior: "warlord",
  sage: "archmage",
  trickster: "shadow",
  balanced: "druid",
};

export function maxHp(creature: Creature): number {
  const lv = creature.stats.str + creature.stats.int + creature.stats.dex;
  return 100 + creature.stats.str * 5 + lv * 10;
}

export function level(creature: Creature): number {
  return creature.stats.str + creature.stats.int + creature.stats.dex;
}
