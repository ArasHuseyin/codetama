import { createHash, randomBytes } from "node:crypto";
import { db } from "@/db/client";
import { cliTokens } from "@/db/schema";
import { and, eq } from "drizzle-orm";

const TOKEN_PREFIX = "codetama_";

export interface IssuedToken {
  id: string;
  full: string;
  prefix: string;
}

export function issueToken(): IssuedToken {
  const raw = randomBytes(24).toString("base64url");
  const full = `${TOKEN_PREFIX}${raw}`;
  return {
    id: "",
    full,
    prefix: full.slice(0, TOKEN_PREFIX.length + 4),
  };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createToken(userId: string, name: string): Promise<IssuedToken> {
  const issued = issueToken();
  const [row] = await db
    .insert(cliTokens)
    .values({
      userId,
      name,
      hashedToken: hashToken(issued.full),
      prefix: issued.prefix,
    })
    .returning({ id: cliTokens.id });
  if (!row) throw new Error("Failed to create token");
  return { ...issued, id: row.id };
}

export async function listTokens(userId: string) {
  return db
    .select({
      id: cliTokens.id,
      name: cliTokens.name,
      prefix: cliTokens.prefix,
      createdAt: cliTokens.createdAt,
      lastUsedAt: cliTokens.lastUsedAt,
      revoked: cliTokens.revoked,
    })
    .from(cliTokens)
    .where(eq(cliTokens.userId, userId));
}

export async function revokeToken(userId: string, tokenId: string): Promise<boolean> {
  const result = await db
    .update(cliTokens)
    .set({ revoked: true, revokedAt: new Date() })
    .where(and(eq(cliTokens.id, tokenId), eq(cliTokens.userId, userId)))
    .returning({ id: cliTokens.id });
  return result.length > 0;
}
