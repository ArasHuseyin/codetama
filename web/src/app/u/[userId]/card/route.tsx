import { ImageResponse } from "next/og";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { creatures, tiles, users } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KLASS_COLORS: Record<string, string> = {
  warrior: "#ff6b6b",
  warlord: "#ff6b6b",
  sage: "#5fb3ff",
  archmage: "#5fb3ff",
  trickster: "#c98aff",
  shadow: "#c98aff",
  balanced: "#7ee787",
  druid: "#7ee787",
};

export async function GET(_req: Request, ctx: { params: Promise<{ userId: string }> }) {
  const { userId } = await ctx.params;

  const [u] = await db
    .select({ name: users.name, streakDays: users.streakDays })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const [creature] = await db
    .select()
    .from(creatures)
    .where(and(eq(creatures.userId, userId), eq(creatures.active, true)))
    .orderBy(creatures.bornAt)
    .limit(1);

  const [tileCount] = await db
    .select({ n: count() })
    .from(tiles)
    .where(eq(tiles.ownerUserId, userId));

  const username = u?.name ?? "anonymous";
  const klass = creature?.klass ?? "—";
  const stage = creature?.stage ?? "egg";
  const klassColor = creature?.klass ? (KLASS_COLORS[creature.klass] ?? "#f5e6c8") : "#f5e6c8";
  const stats = creature
    ? { str: creature.str, int: creature.intStat, dex: creature.dex }
    : { str: 1, int: 1, dex: 1 };
  const lvl = stats.str + stats.int + stats.dex;
  const tiles_ = tileCount?.n ?? 0;
  const streak = u?.streakDays ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          height: "630px",
          width: "1200px",
          display: "flex",
          flexDirection: "column",
          background: "#0a0a0a",
          padding: "60px",
          fontFamily: "monospace",
          color: "#f5e6c8",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "12px",
              background: "#f5e6c8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0a0a0a",
              fontSize: "40px",
              fontWeight: 700,
            }}
          >
            {">"}
          </div>
          <div style={{ display: "flex", fontSize: "32px", color: "#888" }}>codetama.com</div>
        </div>

        <div style={{ display: "flex", marginTop: "60px", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: "24px", color: "#888" }}>@{username}</div>
          <div
            style={{
              display: "flex",
              fontSize: "84px",
              fontWeight: 700,
              color: klassColor,
              marginTop: "10px",
            }}
          >
            {creature?.name ?? "no creature yet"}
          </div>
          <div style={{ display: "flex", gap: "16px", marginTop: "20px" }}>
            <div style={{ display: "flex", fontSize: "32px", color: klassColor }}>{klass}</div>
            <div style={{ display: "flex", fontSize: "32px", color: "#888" }}>·</div>
            <div style={{ display: "flex", fontSize: "32px" }}>{stage}</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "60px",
            marginTop: "auto",
            fontSize: "28px",
            paddingTop: "40px",
            borderTop: "1px solid #333",
          }}
        >
          <Stat label="STR" value={stats.str} color="#ff6b6b" />
          <Stat label="INT" value={stats.int} color="#5fb3ff" />
          <Stat label="DEX" value={stats.dex} color="#c98aff" />
          <Stat label="LV" value={lvl} color="#f5e6c8" />
          <Stat label="TILES" value={tiles_} color="#7ee787" />
          {streak > 0 && <Stat label={streak >= 7 ? "🔥 STREAK" : "STREAK"} value={streak} color="#ffd166" />}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", fontSize: "20px", color: "#666", letterSpacing: "0.1em" }}>{label}</div>
      <div style={{ display: "flex", fontSize: "44px", color, marginTop: "6px" }}>{value}</div>
    </div>
  );
}
