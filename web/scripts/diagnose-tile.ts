/**
 * Read-only: shows where the player's tile sits + nearest enemies + reach check.
 * Pass username as arg, default "Haras".
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { eq, sql } from "drizzle-orm";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const { db } = await import("../src/db/client");
  const { users, tiles } = await import("../src/db/schema");

  const targetName = process.argv[2] ?? "Haras";

  const [me] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.name, targetName)).limit(1);
  if (!me) {
    console.log(`user "${targetName}" not found`);
    process.exit(1);
  }
  console.log(`▶ user: ${me.name} (${me.id})`);

  const myTiles = await db.select().from(tiles).where(eq(tiles.ownerUserId, me.id));
  if (myTiles.length === 0) {
    console.log(`  no tiles for this user — they haven't synced yet`);
    process.exit(0);
  }
  for (const t of myTiles) console.log(`  own tile: (${t.x}, ${t.y})`);

  // For each own tile, find tiles within chebyshev 2 owned by others
  for (const t of myTiles) {
    console.log(`\n▶ neighbors within 2 king-steps of (${t.x}, ${t.y}):`);
    const nearby = await db
      .select({
        x: tiles.x,
        y: tiles.y,
        ownerName: users.name,
        ownerId: users.id,
      })
      .from(tiles)
      .innerJoin(users, eq(users.id, tiles.ownerUserId))
      .where(
        sql`abs(${tiles.x} - ${t.x}) <= 2 AND abs(${tiles.y} - ${t.y}) <= 2 AND ${tiles.ownerUserId} != ${me.id}`,
      );
    if (nearby.length === 0) {
      console.log(`  ✗ NONE — you can't attack anyone from this tile`);
    } else {
      for (const n of nearby) {
        const dx = Math.abs(n.x - t.x);
        const dy = Math.abs(n.y - t.y);
        const dist = Math.max(dx, dy);
        console.log(`  ✓ (${n.x}, ${n.y}) ${n.ownerName ?? "anon"}  · ${dist} step${dist === 1 ? "" : "s"} away`);
      }
    }
  }

  // Show closest non-self tile overall
  console.log("\n▶ closest enemy tile overall:");
  const all = await db
    .select({ x: tiles.x, y: tiles.y, ownerName: users.name })
    .from(tiles)
    .innerJoin(users, eq(users.id, tiles.ownerUserId));
  let closestDist = Infinity;
  let closest: { x: number; y: number; name: string | null } | null = null;
  for (const o of all) {
    if (myTiles.some((m) => m.x === o.x && m.y === o.y)) continue;
    for (const m of myTiles) {
      const d = Math.max(Math.abs(o.x - m.x), Math.abs(o.y - m.y));
      if (d < closestDist) {
        closestDist = d;
        closest = { x: o.x, y: o.y, name: o.ownerName };
      }
    }
  }
  if (closest) {
    console.log(`  ${closest.name} at (${closest.x}, ${closest.y})  · ${closestDist} steps away`);
    if (closestDist > 2) console.log(`  ✗ TOO FAR — game requires ≤2 to attack`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("diagnose failed:", err);
  process.exit(1);
});
