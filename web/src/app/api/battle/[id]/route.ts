import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBattleSnapshot } from "@/lib/battle-state";

export const revalidate = 0;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const snap = await getBattleSnapshot(id);
  if (!snap) return new NextResponse("not found", { status: 404 });

  if (snap.attacker.userId !== session.user.id && snap.defender.userId !== session.user.id) {
    return new NextResponse("forbidden", { status: 403 });
  }

  return NextResponse.json(snap);
}
