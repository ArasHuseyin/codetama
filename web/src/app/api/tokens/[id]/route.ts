import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { revokeToken } from "@/lib/tokens";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  const { id } = await ctx.params;
  const ok = await revokeToken(session.user.id, id);
  return ok ? new NextResponse(null, { status: 204 }) : new NextResponse("not found", { status: 404 });
}
