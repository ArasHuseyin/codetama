import { checkEvolution, type EvolutionResult } from "../core/evolution.js";
import { feedAll } from "../core/hunger.js";
import { activeCreature, loadOrInit, saveState, withStateLock } from "../core/state.js";
import { bumpStreak } from "../core/streak.js";
import { pushSync, shouldSyncNow } from "../core/sync.js";
import type { FoodType, State } from "../types.js";

export interface HookPayload {
  hook_event_name?: string;
  tool_name?: string;
}

export const TOOL_TO_FOOD: Record<string, FoodType> = {
  Bash: "bash",
  Read: "read",
  Grep: "search",
  Glob: "search",
  Edit: "edit",
  Write: "edit",
  MultiEdit: "edit",
  WebFetch: "web",
  WebSearch: "web",
};

/**
 * Pure feed pipeline: feed the active creature, check for evolution, and bump
 * the daily streak on prompts. Returns the next state plus any evolution events
 * to report. Kept side-effect-free so it can be unit/integration tested.
 */
export function applyFeed(
  state: State,
  food: FoodType,
  now: number,
): { state: State; events: EvolutionResult["events"] } {
  const active = activeCreature(state);
  const fedState = feedAll(state, food, now, active?.id ?? null);
  const evolved = checkEvolution(fedState, now);
  const streaked = food === "prompt" ? bumpStreak(evolved.state, now) : evolved.state;
  return { state: streaked, events: evolved.events };
}

export async function runFeed(payloadOverride?: HookPayload): Promise<void> {
  const payload = payloadOverride ?? (await readStdinJson());
  const food = mapPayloadToFood(payload);
  if (!food) return;

  const now = Date.now();
  // Load → mutate → save under a lock so a concurrent hook can't overwrite us.
  const { streaked, events } = withStateLock(() => {
    const state = loadOrInit();
    const applied = applyFeed(state, food, now);
    saveState(applied.state);
    return { streaked: applied.state, events: applied.events };
  });

  for (const ev of events) {
    if (ev.spawnedNewEgg) {
      process.stderr.write(`Your elder has reached its peak. A new egg has appeared alongside it.\n`);
    } else if (ev.klass) {
      process.stderr.write(`Your creature has evolved into ${ev.klass} (${ev.to}).\n`);
    } else {
      process.stderr.write(`Your creature evolved to ${ev.to}.\n`);
    }
  }

  await maybeSync(streaked, now);
}

export function mapPayloadToFood(payload: HookPayload): FoodType | null {
  if (payload.hook_event_name === "UserPromptSubmit") return "prompt";
  if (payload.hook_event_name === "PostToolUse" && payload.tool_name) {
    return TOOL_TO_FOOD[payload.tool_name] ?? null;
  }
  return null;
}

async function readStdinJson(): Promise<HookPayload> {
  if (process.stdin.isTTY) return {};
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (raw === "") return {};
  try {
    return JSON.parse(raw) as HookPayload;
  } catch (e) {
    process.stderr.write(`[codetama] could not parse hook payload as JSON: ${(e as Error).message}\n`);
    return {};
  }
}

async function maybeSync(state: State, now: number): Promise<void> {
  if (!shouldSyncNow(state, now)) return;
  const result = await pushSync(state, now);

  // Re-read under the lock so we merge incoming events into the latest on-disk
  // state (which a concurrent hook may have advanced) without losing it.
  withStateLock(() => {
    const after = loadOrInit();
    if (!after.cloud) return;

    const incoming = (result.events ?? []).map((e) => ({
      id: e.id,
      kind: e.kind,
      payload: e.payload,
      createdAt: e.createdAt,
      shown: false,
    }));
    const existing = after.remoteEvents ?? [];
    const seen = new Set(existing.map((e) => e.id));
    const merged = [...existing, ...incoming.filter((e) => !seen.has(e.id))];
    const trimmed = merged.slice(-50);

    saveState({
      ...after,
      remoteEvents: trimmed,
      cloud: {
        ...after.cloud,
        lastSyncAt: result.ok ? now : after.cloud.lastSyncAt,
        lastSyncError: result.ok ? null : (result.error ?? "unknown"),
      },
    });
  });
}
