import { NextResponse } from "next/server";
import { authenticateCli } from "@/lib/auth-cli";
import { db } from "@/db/client";
import { creatures, events, users } from "@/db/schema";
import { isNull } from "drizzle-orm";
import { and, eq, inArray } from "drizzle-orm";
import { ensureUserHasTile } from "@/lib/tiles";
import { capSuspiciousGains } from "@/lib/anti-cheat";
import { checkRate, rateLimitHeaders } from "@/lib/rate-limit";

const SYNC_WINDOW_MS = 60_000;
const SYNC_MAX = 30;

interface SyncCreatureBody {
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

interface SyncBody {
  creatures: SyncCreatureBody[];
  rebirths: number;
  streak?: {
    days: number;
    longestDays: number;
    lastActivityDay: string;
  };
}

const VALID_STAGES = new Set(["egg", "baby", "adult", "elder", "dead"]);

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function isUuidish(s: string): boolean {
  return typeof s === "string" && s.length >= 8 && s.length <= 64;
}

function sanitize(c: SyncCreatureBody): SyncCreatureBody | string {
  if (!isUuidish(c.id)) return "invalid creature id";
  if (typeof c.name !== "string" || c.name.length === 0 || c.name.length > 64) return "invalid name";
  if (!VALID_STAGES.has(c.stage)) return "invalid stage";
  if (c.klass !== null && typeof c.klass !== "string") return "invalid klass";
  if (typeof c.stats !== "object" || !c.stats) return "invalid stats";
  return {
    id: c.id,
    name: c.name,
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

export async function POST(req: Request) {
  const user = await authenticateCli(req);
  if (!user) return new NextResponse("unauthorized", { status: 401 });

  const rate = checkRate(`sync:${user.id}`, { windowMs: SYNC_WINDOW_MS, max: SYNC_MAX });
  if (!rate.ok) {
    return new NextResponse("rate limit exceeded", {
      status: 429,
      headers: rateLimitHeaders(rate, SYNC_MAX),
    });
  }

  const raw = (await req.json().catch(() => null)) as SyncBody | null;
  if (!raw || !Array.isArray(raw.creatures)) {
    return new NextResponse("invalid body", { status: 400 });
  }
  if (raw.creatures.length > 1000) {
    return new NextResponse("too many creatures", { status: 400 });
  }

  const sanitized: SyncCreatureBody[] = [];
  for (const c of raw.creatures) {
    const s = sanitize(c);
    if (typeof s === "string") return new NextResponse(s, { status: 400 });
    sanitized.push(s);
  }

  const now = new Date();
  const incomingIds = sanitized.map((c) => c.id);

  // Pre-check: detect cross-user IDs in one batch. Creature IDs are exposed publicly
  // via /api/map, so we must reject any sync that targets an id owned by another user.
  const existingRows = incomingIds.length > 0
    ? await db
        .select({
          id: creatures.id,
          userId: creatures.userId,
          lastSyncedAt: creatures.lastSyncedAt,
          str: creatures.str,
          intStat: creatures.intStat,
          dex: creatures.dex,
        })
        .from(creatures)
        .where(inArray(creatures.id, incomingIds))
    : [];

  const existingByOwn = new Map<
    string,
    { lastSyncedAt: Date; str: number; intStat: number; dex: number }
  >();
  for (const row of existingRows) {
    if (row.userId !== user.id) {
      return new NextResponse("forbidden — creature id belongs to another user", { status: 403 });
    }
    existingByOwn.set(row.id, {
      lastSyncedAt: row.lastSyncedAt,
      str: row.str,
      intStat: row.intStat,
      dex: row.dex,
    });
  }

  for (const c of sanitized) {
    const prev = existingByOwn.get(c.id) ?? null;

    const cap = capSuspiciousGains(
      prev,
      { str: c.stats.str, int: c.stats.int, dex: c.stats.dex },
      now,
    );

    const values = {
      id: c.id,
      userId: user.id,
      name: c.name,
      stage: c.stage,
      klass: c.klass,
      str: cap.stats.str,
      intStat: cap.stats.int,
      dex: cap.stats.dex,
      hunger: c.hunger,
      promptsTotal: c.promptsTotal,
      promptsThisStage: c.promptsThisStage,
      bornAt: new Date(c.bornAt),
      lastFedAt: new Date(c.lastFedAt),
      lastSyncedAt: now,
      diedAt: c.diedAt === null ? null : new Date(c.diedAt),
      rebirths: clamp(raw.rebirths, 0, 1_000_000),
      active: !c.locked && c.stage !== "dead",
    };

    await db
      .insert(creatures)
      .values(values)
      .onConflictDoUpdate({
        target: creatures.id,
        // Belt-and-suspenders: even if the pre-check missed a row created
        // between SELECT and INSERT, this WHERE prevents another user's
        // row from being mutated.
        setWhere: eq(creatures.userId, user.id),
        set: {
          name: values.name,
          stage: values.stage,
          klass: values.klass,
          str: values.str,
          intStat: values.intStat,
          dex: values.dex,
          hunger: values.hunger,
          promptsTotal: values.promptsTotal,
          promptsThisStage: values.promptsThisStage,
          lastFedAt: values.lastFedAt,
          lastSyncedAt: values.lastSyncedAt,
          diedAt: values.diedAt,
          active: values.active,
        },
      });
  }

  // Soft-delete creatures the CLI no longer reports (revoked from sync).
  if (incomingIds.length > 0) {
    await db
      .update(creatures)
      .set({ active: false })
      .where(and(eq(creatures.userId, user.id), notIn(creatures.id, incomingIds)));
  }

  if (raw.streak) {
    const days = clamp(raw.streak.days, 0, 100_000);
    const longest = clamp(raw.streak.longestDays, days, 100_000);
    const lastDay = typeof raw.streak.lastActivityDay === "string" ? raw.streak.lastActivityDay.slice(0, 10) : null;
    if (lastDay && /^\d{4}-\d{2}-\d{2}$/.test(lastDay)) {
      await db
        .update(users)
        .set({ streakDays: days, streakLongest: longest, streakLastDay: lastDay })
        .where(eq(users.id, user.id));
    }
  }

  // Place new users on the map (idempotent — only places once).
  const baseCreatureId = sanitized[0]?.id ?? null;
  await ensureUserHasTile(user.id, baseCreatureId).catch(() => {
    // non-fatal; sync still succeeds even if tile placement fails
  });

  const pending = await db
    .select({
      id: events.id,
      kind: events.kind,
      payload: events.payload,
      createdAt: events.createdAt,
    })
    .from(events)
    .where(and(eq(events.userId, user.id), isNull(events.deliveredAt)))
    .limit(50);

  const deliveredIds = pending.map((e) => e.id);
  if (deliveredIds.length > 0) {
    await db
      .update(events)
      .set({ deliveredAt: now })
      .where(and(eq(events.userId, user.id), inArray(events.id, deliveredIds)));
  }

  const eventsOut = pending.map((e) => {
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(e.payload);
    } catch {
      parsed = null;
    }
    return {
      id: e.id,
      kind: e.kind,
      payload: parsed,
      createdAt: e.createdAt.toISOString(),
    };
  });

  return NextResponse.json({
    ok: true,
    count: sanitized.length,
    syncedAt: now.toISOString(),
    events: eventsOut,
  });
}

import { sql, type SQLWrapper } from "drizzle-orm";

function notIn<T>(column: SQLWrapper, values: T[]) {
  if (values.length === 0) return sql`true`;
  return sql`${column} not in (${sql.join(values.map((v) => sql`${v}`), sql`, `)})`;
}

