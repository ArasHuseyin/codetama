import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createToken } from "@/lib/tokens";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as { name?: string } | null;
  const name = body?.name?.trim();
  if (!name) {
    return new NextResponse("name required", { status: 400 });
  }
  if (name.length > 64) {
    return new NextResponse("name too long", { status: 400 });
  }
  const issued = await createToken(session.user.id, name);
  return NextResponse.json({
    token: issued.full,
    record: {
      id: issued.id,
      name,
      prefix: issued.prefix,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      revoked: false,
    },
  });
}
