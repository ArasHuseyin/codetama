import { checkEvolution } from "../core/evolution.js";
import { feedAll } from "../core/hunger.js";
import { withFileLock } from "../core/lock.js";
import { activeCreature, getStatePath, loadOrInit, saveState } from "../core/state.js";
import { bumpStreak } from "../core/streak.js";
import { pushSync, shouldSyncNow } from "../core/sync.js";
import type { FoodType, State } from "../types.js";

/** Remote events kept locally between views; older ones are dropped. */
const REMOTE_EVENTS_MAX = 50;

interface HookPayload {
  hook_event_name?: string;
  tool_name?: string;
}

const TOOL_TO_FOOD: Record<string, FoodType> = {
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

export async function runFeed(): Promise<void> {
  const payload = await readStdinJson();
  const food = mapPayloadToFood(payload);
  if (!food) return;

  const now = Date.now();
  // Claude Code may run several feed hooks concurrently; lock the whole
  // read-modify-write so parallel feeds don't overwrite each other.
  const { streaked, evolved } = await withFileLock(getStatePath(), () => {
    const state = loadOrInit();
    const active = activeCreature(state);
    const fedState = feedAll(state, food, now, active?.id ?? null);
    const evo = checkEvolution(fedState, now);
    const next = food === "prompt" ? bumpStreak(evo.state, now) : evo.state;
    saveState(next);
    return { streaked: next, evolved: evo };
  });

  for (const ev of evolved.events) {
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

function mapPayloadToFood(payload: HookPayload): FoodType | null {
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
  } catch {
    return {};
  }
}

async function maybeSync(state: State, now: number): Promise<void> {
  if (!shouldSyncNow(state, now)) return;
  // The network call stays outside the lock; only the reload-merge-save of
  // the state file needs to be exclusive.
  const result = await pushSync(state, now);

  await withFileLock(getStatePath(), () => {
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
    const trimmed = merged.slice(-REMOTE_EVENTS_MAX);

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
