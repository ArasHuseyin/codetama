import { NextResponse } from "next/server";
import { authenticateCli } from "@/lib/auth-cli";
import { db } from "@/db/client";
import { creatures } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(req: Request) {
  const user = await authenticateCli(req);
  if (!user) return new NextResponse("unauthorized", { status: 401 });

  const rows = await db
    .select()
    .from(creatures)
    .where(and(eq(creatures.userId, user.id), eq(creatures.active, true)));

  return NextResponse.json({
    user: { id: user.id, name: user.name, image: user.image },
    creatures: rows,
  });
}
