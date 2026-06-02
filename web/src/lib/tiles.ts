import { db } from "@/db/client";
import { tiles } from "@/db/schema";
import { and, count, eq, sql } from "drizzle-orm";
import { findNextFreeSpawn } from "./spawn";

// A single advisory lock serializes all spawn placements. Placement only happens
// once per new user and is fast, so a global lock is cheap — and it guarantees
// the existence re-check, spawn search, and insert see a consistent map (no
// double tiles for one user, no two users racing onto the same coordinate).
const TILE_PLACEMENT_LOCK = 0x7c0de7a; // arbitrary constant key

export async function ensureUserHasTile(userId: string, baseCreatureId: string | null): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${TILE_PLACEMENT_LOCK})`);

    const [existing] = await tx
      .select({ id: tiles.id })
      .from(tiles)
      .where(eq(tiles.ownerUserId, userId))
      .limit(1);

    if (existing) return;

    const [{ value: total = 0 } = { value: 0 }] = await tx
      .select({ value: count() })
      .from(tiles);

    const startIndex = Number(total) || 0;

    const spawn = await findNextFreeSpawn(
      async (x, y) => {
        const [hit] = await tx
          .select({ id: tiles.id })
          .from(tiles)
          .where(and(eq(tiles.x, x), eq(tiles.y, y)))
          .limit(1);
        return Boolean(hit);
      },
      startIndex,
    );

    await tx
      .insert(tiles)
      .values({
        x: spawn.x,
        y: spawn.y,
        ownerUserId: userId,
        baseCreatureId,
      })
      .onConflictDoNothing();
  });
}
