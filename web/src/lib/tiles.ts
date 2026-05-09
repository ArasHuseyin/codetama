import { db } from "@/db/client";
import { tiles } from "@/db/schema";
import { and, count, eq } from "drizzle-orm";
import { findNextFreeSpawn } from "./spawn";

export async function ensureUserHasTile(userId: string, baseCreatureId: string | null): Promise<void> {
  const [existing] = await db
    .select({ id: tiles.id })
    .from(tiles)
    .where(eq(tiles.ownerUserId, userId))
    .limit(1);

  if (existing) return;

  const [{ value: total = 0 } = { value: 0 }] = await db
    .select({ value: count() })
    .from(tiles);

  const startIndex = Number(total) || 0;

  const spawn = await findNextFreeSpawn(
    async (x, y) => {
      const [hit] = await db
        .select({ id: tiles.id })
        .from(tiles)
        .where(and(eq(tiles.x, x), eq(tiles.y, y)))
        .limit(1);
      return Boolean(hit);
    },
    startIndex,
  );

  await db
    .insert(tiles)
    .values({
      x: spawn.x,
      y: spawn.y,
      ownerUserId: userId,
      baseCreatureId,
    })
    .onConflictDoNothing();
}
