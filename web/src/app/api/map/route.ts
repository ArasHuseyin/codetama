import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { creatures, tileAds, tiles, users } from "@/db/schema";
import { and, asc, eq, gte, isNull, lte, ne, sql } from "drizzle-orm";

export const revalidate = 0;

interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const MAX_BBOX_SPAN = 200;
const MAX_TILES = 1_000;

export async function GET(req: Request) {
  const session = await auth();
  const parsed = parseBBox(new URL(req.url).searchParams.get("bbox"));
  if (parsed instanceof NextResponse) return parsed;

  const viewport = parsed
    ? and(
        gte(tiles.x, parsed.minX),
        lte(tiles.x, parsed.maxX),
        gte(tiles.y, parsed.minY),
        lte(tiles.y, parsed.maxY),
      )
    : sql`true`;

  const rows = await db
    .select({
      x: tiles.x,
      y: tiles.y,
      acquiredAt: tiles.acquiredAt,
      ownerId: users.id,
      ownerName: users.name,
      ownerImage: users.image,
      creatureId: creatures.id,
      creatureName: creatures.name,
      stage: creatures.stage,
      klass: creatures.klass,
      str: creatures.str,
      intStat: creatures.intStat,
      dex: creatures.dex,
      hunger: creatures.hunger,
      bornAt: creatures.bornAt,
      adText: tileAds.text,
      adUrl: tileAds.url,
      adStatus: tileAds.status,
    })
    .from(tiles)
    .innerJoin(users, eq(users.id, tiles.ownerUserId))
    .leftJoin(
      creatures,
      and(eq(creatures.userId, tiles.ownerUserId), ne(creatures.stage, "dead"), isNull(creatures.diedAt)),
    )
    .leftJoin(tileAds, eq(tileAds.userId, tiles.ownerUserId))
    .where(viewport)
    .orderBy(asc(tiles.x), asc(tiles.y))
    .limit(MAX_TILES * 4);

  // Defensive dedup: legacy rows in prod may still have multiple active
  // creatures. Always show the strongest creature for the tile owner.
  const byTile = new Map<string, typeof rows[number]>();
  for (const r of rows) {
    const key = `${r.x},${r.y}`;
    const existing = byTile.get(key);
    if (!existing) {
      byTile.set(key, r);
      continue;
    }
    if (isStrongerTileCreature(r, existing)) byTile.set(key, r);
  }

  const deduped = Array.from(byTile.values()).slice(0, MAX_TILES);
  const viewerCreatures = session?.user?.id
    ? await db
        .select({
          id: creatures.id,
          name: creatures.name,
          stage: creatures.stage,
          klass: creatures.klass,
          str: creatures.str,
          intStat: creatures.intStat,
          dex: creatures.dex,
          hunger: creatures.hunger,
          bornAt: creatures.bornAt,
        })
        .from(creatures)
        .where(and(eq(creatures.userId, session.user.id), ne(creatures.stage, "dead"), isNull(creatures.diedAt)))
    : [];

  viewerCreatures.sort((a, b) => {
    const powerDelta = creatureLevel(b) - creatureLevel(a);
    if (powerDelta !== 0) return powerDelta;
    return b.bornAt.getTime() - a.bornAt.getTime();
  });

  return NextResponse.json({
    tiles: deduped.map((r) => ({
      x: r.x,
      y: r.y,
      acquiredAt: r.acquiredAt.toISOString(),
      owner: {
        id: r.ownerId,
        name: r.ownerName,
        image: r.ownerImage,
      },
      creature: r.creatureId
        ? {
            id: r.creatureId,
            name: r.creatureName,
            stage: r.stage,
            klass: r.klass,
            level: (r.str ?? 1) + (r.intStat ?? 1) + (r.dex ?? 1),
            stats: { str: r.str, int: r.intStat, dex: r.dex },
            hunger: r.hunger,
          }
        : null,
      ad:
        r.adStatus === "active"
          ? {
              text: r.adText,
              url: r.adUrl,
            }
          : null,
    })),
    viewerCreatures: viewerCreatures.map((c) => ({
      id: c.id,
      name: c.name,
      stage: c.stage,
      klass: c.klass,
      level: creatureLevel(c),
      stats: { str: c.str, int: c.intStat, dex: c.dex },
      hunger: c.hunger,
    })),
  });
}

function creatureLevel(c: { str: number | null; intStat: number | null; dex: number | null }): number {
  return (c.str ?? 1) + (c.intStat ?? 1) + (c.dex ?? 1);
}

function isStrongerTileCreature(
  incoming: {
    creatureId: string | null;
    str: number | null;
    intStat: number | null;
    dex: number | null;
    bornAt: Date | null;
  },
  existing: {
    creatureId: string | null;
    str: number | null;
    intStat: number | null;
    dex: number | null;
    bornAt: Date | null;
  },
): boolean {
  if (incoming.creatureId && !existing.creatureId) return true;
  if (!incoming.creatureId) return false;

  const incomingLevel = creatureLevel(incoming);
  const existingLevel = creatureLevel(existing);
  if (incomingLevel !== existingLevel) return incomingLevel > existingLevel;

  return (incoming.bornAt?.getTime() ?? 0) > (existing.bornAt?.getTime() ?? 0);
}

function parseBBox(raw: string | null): BBox | null | NextResponse {
  if (!raw) return null;

  const parts = raw.split(",").map((value) => Number(value));
  if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) {
    return new NextResponse("invalid bbox", { status: 400 });
  }

  const [rawMinX, rawMinY, rawMaxX, rawMaxY] = parts as [number, number, number, number];
  const minX = Math.floor(rawMinX);
  const minY = Math.floor(rawMinY);
  const maxX = Math.ceil(rawMaxX);
  const maxY = Math.ceil(rawMaxY);

  if (minX > maxX || minY > maxY) {
    return new NextResponse("invalid bbox", { status: 400 });
  }

  if (maxX - minX > MAX_BBOX_SPAN || maxY - minY > MAX_BBOX_SPAN) {
    return new NextResponse("bbox too large", { status: 400 });
  }

  return { minX, minY, maxX, maxY };
}
