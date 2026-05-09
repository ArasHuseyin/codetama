import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { submitMove } from "@/lib/battle-state";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { skillId?: string } | null;
  const skillId = body?.skillId;
  if (!skillId) return new NextResponse("skillId required", { status: 400 });

  const result = await submitMove({
    battleId: id,
    actorUserId: session.user.id,
    skillId,
  });
  if ("error" in result) return new NextResponse(result.error, { status: 400 });
  return NextResponse.json({ ok: true });
}
