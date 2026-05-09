import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { creatures, tiles, users } from "@/db/schema";
import { countDistinct, desc, eq, sql } from "drizzle-orm";

export const revalidate = 0;

export async function GET() {
  // Joining tiles AND creatures inflates count by creatures-per-user.
  // Use countDistinct(tiles.id) so multiple creatures don't multiply tile counts.
  const tileCount = countDistinct(tiles.id).as("tile_count");
  const rows = await db
    .select({
      userId: users.id,
      username: users.name,
      image: users.image,
      tileCount,
      activeKlass: sql<string | null>`max(case when ${creatures.active} = true then ${creatures.klass} end)`,
      activeStr: sql<number | null>`max(case when ${creatures.active} = true then ${creatures.str} end)`,
      activeInt: sql<number | null>`max(case when ${creatures.active} = true then ${creatures.intStat} end)`,
      activeDex: sql<number | null>`max(case when ${creatures.active} = true then ${creatures.dex} end)`,
    })
    .from(users)
    .innerJoin(tiles, eq(tiles.ownerUserId, users.id))
    .leftJoin(creatures, eq(creatures.userId, users.id))
    .groupBy(users.id, users.name, users.image)
    .orderBy(desc(countDistinct(tiles.id)))
    .limit(100);

  const total = rows.length;
  const ranks = rows.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    username: r.username,
    image: r.image,
    tileCount: Number(r.tileCount),
    klass: r.activeKlass,
    level: (r.activeStr ?? 0) + (r.activeInt ?? 0) + (r.activeDex ?? 0),
    tier: tierFor(i + 1, total),
  }));

  return NextResponse.json({ leaderboard: ranks });
}

function tierFor(rank: number, total: number): "diamond" | "gold" | "silver" | "bronze" {
  if (total === 0) return "bronze";
  const pct = rank / total;
  if (pct <= 0.01) return "diamond";
  if (pct <= 0.05) return "gold";
  if (pct <= 0.20) return "silver";
  return "bronze";
}
