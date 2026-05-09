import { checkEvolution } from "../core/evolution.js";
import { feedAll } from "../core/hunger.js";
import { activeCreature, loadOrInit, saveState } from "../core/state.js";
import { pushSync, shouldSyncNow } from "../core/sync.js";
import type { FoodType, State } from "../types.js";

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
  const state = loadOrInit();
  const active = activeCreature(state);
  const fedState = feedAll(state, food, now, active?.id ?? null);
  const evolved = checkEvolution(fedState, now);
  saveState(evolved.state);

  for (const ev of evolved.events) {
    if (ev.spawnedNewEgg) {
      process.stderr.write(`Your elder has reached its peak. A new egg has appeared alongside it.\n`);
    } else if (ev.klass) {
      process.stderr.write(`Your creature has evolved into ${ev.klass} (${ev.to}).\n`);
    } else {
      process.stderr.write(`Your creature evolved to ${ev.to}.\n`);
    }
  }

  await maybeSync(evolved.state, now);
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
  const result = await pushSync(state, now);
  const after = loadOrInit();
  if (after.cloud) {
    saveState({
      ...after,
      cloud: {
        ...after.cloud,
        lastSyncAt: result.ok ? now : after.cloud.lastSyncAt,
        lastSyncError: result.ok ? null : (result.error ?? "unknown"),
      },
    });
  }
}
