import { NextResponse } from "next/server";
import { authenticateCli } from "@/lib/auth-cli";
import { db } from "@/db/client";
import { creatures } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { ensureUserHasTile } from "@/lib/tiles";
import { capSuspiciousGains } from "@/lib/anti-cheat";

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

  // Upsert each creature by (user_id, id) — using id as the canonical key from CLI.
  // Mark not-sent creatures as inactive (soft delete).
  const incomingIds = sanitized.map((c) => c.id);

  for (const c of sanitized) {
    const [prev] = await db
      .select({
        lastSyncedAt: creatures.lastSyncedAt,
        str: creatures.str,
        intStat: creatures.intStat,
        dex: creatures.dex,
      })
      .from(creatures)
      .where(eq(creatures.id, c.id))
      .limit(1);

    const cap = capSuspiciousGains(
      prev ?? null,
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
      active: true,
    };

    await db
      .insert(creatures)
      .values(values)
      .onConflictDoUpdate({
        target: creatures.id,
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
          active: true,
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

  // Place new users on the map (idempotent — only places once).
  const baseCreatureId = sanitized[0]?.id ?? null;
  await ensureUserHasTile(user.id, baseCreatureId).catch(() => {
    // non-fatal; sync still succeeds even if tile placement fails
  });

  return NextResponse.json({ ok: true, count: sanitized.length, syncedAt: now.toISOString() });
}

import { sql, type SQLWrapper } from "drizzle-orm";

function notIn<T>(column: SQLWrapper, values: T[]) {
  if (values.length === 0) return sql`true`;
  return sql`${column} not in (${sql.join(values.map((v) => sql`${v}`), sql`, `)})`;
}

// silence unused import
void inArray;
