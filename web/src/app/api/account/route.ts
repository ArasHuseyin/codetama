import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth, signOut } from "@/auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  await db.delete(users).where(eq(users.id, userId));

  await signOut({ redirect: false });
  return new NextResponse(null, { status: 204 });
}
