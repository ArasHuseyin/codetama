import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { startBattle } from "@/lib/battle-state";
import { computeAttackCooldown } from "@/lib/battle-cooldown";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("unauthorized", { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | { defenderUserId?: string; attackerCreatureId?: string; tileX?: number; tileY?: number }
    | null;
  const defenderUserId = body?.defenderUserId;
  const attackerCreatureId = body?.attackerCreatureId;
  const tileX = body?.tileX;
  const tileY = body?.tileY;
  if (!defenderUserId || typeof defenderUserId !== "string") {
    return new NextResponse("defenderUserId required", { status: 400 });
  }
  if (attackerCreatureId !== undefined && typeof attackerCreatureId !== "string") {
    return new NextResponse("attackerCreatureId must be a string", { status: 400 });
  }
  if (typeof tileX !== "number" || typeof tileY !== "number" || !Number.isFinite(tileX) || !Number.isFinite(tileY)) {
    return new NextResponse("tile coordinates required", { status: 400 });
  }

  const cooldown = await computeAttackCooldown(session.user.id);
  if (!cooldown.ready) {
    return NextResponse.json(
      {
        error: "attack on cooldown",
        readyAt: cooldown.readyAt?.toISOString() ?? null,
        remainingMs: cooldown.remainingMs,
      },
      { status: 429 },
    );
  }

  const result = await startBattle({
    attackerUserId: session.user.id,
    defenderUserId,
    attackerCreatureId,
    tileX: Math.round(tileX),
    tileY: Math.round(tileY),
  });
  if ("error" in result) return new NextResponse(result.error, { status: 400 });
  return NextResponse.json({ battleId: result.battleId });
}
