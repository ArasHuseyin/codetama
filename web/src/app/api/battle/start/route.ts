import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { startBattle } from "@/lib/battle-state";
import { computeEnergy } from "@/lib/battle-energy";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("unauthorized", { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | { defenderUserId?: string; tileX?: number; tileY?: number }
    | null;
  const defenderUserId = body?.defenderUserId;
  const tileX = body?.tileX;
  const tileY = body?.tileY;
  if (!defenderUserId || typeof defenderUserId !== "string") {
    return new NextResponse("defenderUserId required", { status: 400 });
  }
  if (typeof tileX !== "number" || typeof tileY !== "number" || !Number.isFinite(tileX) || !Number.isFinite(tileY)) {
    return new NextResponse("tile coordinates required", { status: 400 });
  }

  const energy = await computeEnergy(session.user.id);
  if (energy.available <= 0) {
    return NextResponse.json(
      { error: "no battle energy", regenInMs: energy.nextRegenInMs },
      { status: 429 },
    );
  }

  const result = await startBattle({
    attackerUserId: session.user.id,
    defenderUserId,
    tileX: Math.round(tileX),
    tileY: Math.round(tileY),
  });
  if ("error" in result) return new NextResponse(result.error, { status: 400 });
  return NextResponse.json({ battleId: result.battleId });
}
