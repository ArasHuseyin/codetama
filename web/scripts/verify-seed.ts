/**
 * Read-only sanity check after seeding. Counts rows + shows distribution.
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { sql, desc } from "drizzle-orm";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const { db } = await import("../src/db/client");
  const { users, creatures, tiles } = await import("../src/db/schema");

  const [{ count: userCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);
  const [{ count: creatureCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(creatures);
  const [{ count: tileCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tiles);

  console.log(`db state:`);
  console.log(`  users:     ${userCount}`);
  console.log(`  creatures: ${creatureCount}`);
  console.log(`  tiles:     ${tileCount}`);

  const tilesPerUser = await db
    .select({
      ownerName: users.name,
      tiles: sql<number>`count(${tiles.id})::int`,
      lvl: sql<number>`(${creatures.str} + ${creatures.intStat} + ${creatures.dex})::int`,
      klass: creatures.klass,
    })
    .from(tiles)
    .innerJoin(users, sql`${tiles.ownerUserId} = ${users.id}`)
    .innerJoin(creatures, sql`${creatures.userId} = ${users.id}`)
    .groupBy(users.name, creatures.str, creatures.intStat, creatures.dex, creatures.klass)
    .orderBy(desc(sql`count(${tiles.id})`))
    .limit(20);

  console.log(`\ntop 20 by tile count:`);
  for (const row of tilesPerUser) {
    const klass = (row.klass ?? "—").padEnd(11);
    console.log(`  ${row.tiles.toString().padStart(2)}× ${klass} LV${row.lvl.toString().padStart(4)}  ${row.ownerName}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("verify failed:", err);
  process.exit(1);
});
