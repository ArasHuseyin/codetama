import { createHash } from "node:crypto";
import { db } from "@/db/client";
import { cliTokens, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export interface AuthedUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  tokenId: string;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function authenticateCli(req: Request): Promise<AuthedUser | null> {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length).trim();
  if (!token) return null;

  const hashed = hashToken(token);
  const [row] = await db
    .select({
      tokenId: cliTokens.id,
      revoked: cliTokens.revoked,
      userId: cliTokens.userId,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(cliTokens)
    .innerJoin(users, eq(users.id, cliTokens.userId))
    .where(and(eq(cliTokens.hashedToken, hashed), eq(cliTokens.revoked, false)))
    .limit(1);

  if (!row) return null;

  void db
    .update(cliTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(cliTokens.id, row.tokenId))
    .catch(() => {});

  return {
    id: row.userId,
    name: row.name,
    email: row.email,
    image: row.image,
    tokenId: row.tokenId,
  };
}
