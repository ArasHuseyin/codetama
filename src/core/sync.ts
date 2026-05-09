import { DEFAULT_SERVER_URL, SYNC_THROTTLE_MS, type Creature, type State } from "../types.js";

export function getServerUrl(state?: State): string {
  if (process.env.CODETAMA_SERVER_URL) return process.env.CODETAMA_SERVER_URL;
  if (state?.cloud?.serverUrl) return state.cloud.serverUrl;
  return DEFAULT_SERVER_URL;
}

interface ValidateResponse {
  user: { id: string; name: string | null; image: string | null };
  creatures: unknown[];
}

export async function validateToken(serverUrl: string, token: string): Promise<ValidateResponse | { error: string }> {
  try {
    const res = await fetch(`${serverUrl}/api/cli/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) return { error: "invalid or revoked token" };
    if (!res.ok) return { error: `server returned ${res.status}` };
    return (await res.json()) as ValidateResponse;
  } catch (e) {
    return { error: `network error: ${(e as Error).message}` };
  }
}

interface SyncCreatureBody {
  id: string;
  name: string;
  stage: Creature["stage"];
  klass: Creature["klass"];
  stats: Creature["stats"];
  hunger: number;
  promptsTotal: number;
  promptsThisStage: number;
  bornAt: number;
  lastFedAt: number;
  diedAt: number | null;
  locked: boolean;
}

interface SyncBody {
  creatures: SyncCreatureBody[];
  rebirths: number;
  streak?: { days: number; longestDays: number; lastActivityDay: string };
}

export function buildSyncBody(state: State): SyncBody {
  const body: SyncBody = {
    rebirths: state.history.rebirths,
    creatures: state.creatures.map((c) => ({
      id: c.id,
      name: c.name,
      stage: c.stage,
      klass: c.klass,
      stats: c.stats,
      hunger: c.hunger,
      promptsTotal: c.promptsTotal,
      promptsThisStage: c.promptsThisStage,
      bornAt: c.bornAt,
      lastFedAt: c.lastFedAt,
      diedAt: c.diedAt,
      locked: c.locked,
    })),
  };
  if (state.streak) {
    body.streak = {
      days: state.streak.days,
      longestDays: state.streak.longestDays,
      lastActivityDay: state.streak.lastActivityDay,
    };
  }
  return body;
}

export interface PushSyncResult {
  ok: boolean;
  error?: string;
  events?: Array<{ id: string; kind: string; payload: unknown; createdAt: string }>;
}

export async function pushSync(state: State, _now: number = Date.now()): Promise<PushSyncResult> {
  if (state.mode !== "multiplayer" || !state.cloud) return { ok: false, error: "not in multiplayer mode" };

  const url = `${getServerUrl(state)}/api/cli/sync`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${state.cloud.token}`,
      },
      body: JSON.stringify(buildSyncBody(state)),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `${res.status}: ${text}` };
    }
    const body = (await res.json().catch(() => null)) as
      | { events?: Array<{ id: string; kind: string; payload: unknown; createdAt: string }> }
      | null;
    return { ok: true, events: body?.events ?? [] };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function shouldSyncNow(state: State, now: number = Date.now()): boolean {
  if (state.mode !== "multiplayer" || !state.cloud) return false;
  const last = state.cloud.lastSyncAt ?? 0;
  return now - last >= SYNC_THROTTLE_MS;
}
