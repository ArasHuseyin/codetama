import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { tileAds } from "@/db/schema";
import { validateTileAd } from "@/lib/tile-ad";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("unauthorized", { status: 401 });

  const [row] = await db.select().from(tileAds).where(eq(tileAds.userId, session.user.id)).limit(1);
  if (!row) {
    return NextResponse.json({ status: "none", text: null, url: null });
  }
  return NextResponse.json({
    status: row.status,
    text: row.text,
    url: row.url,
    paidAt: row.paidAt?.toISOString() ?? null,
    rejectReason: row.rejectReason,
  });
}

/**
 * Save / update the user's draft text+url. Doesn't trigger payment —
 * use POST /api/stripe/checkout for that. If the row is already 'active'
 * this endpoint just edits the live ad text/url (free edits after payment).
 */
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("unauthorized", { status: 401 });

  const body = (await req.json().catch(() => null)) as { text?: string | null; url?: string | null } | null;
  if (!body) return new NextResponse("invalid body", { status: 400 });

  const v = validateTileAd(body.text ?? null, body.url ?? null);
  if (!v.ok) return new NextResponse(v.reason ?? "invalid", { status: 400 });

  const [existing] = await db.select().from(tileAds).where(eq(tileAds.userId, session.user.id)).limit(1);

  if (!existing) {
    await db.insert(tileAds).values({
      userId: session.user.id,
      text: v.text,
      url: v.url,
      status: "draft",
    });
  } else {
    // If editing an active ad with a new URL that needs review, downgrade to pending_review.
    let nextStatus = existing.status;
    if (existing.status === "active" && v.needsReview && v.url !== existing.url) {
      nextStatus = "pending_review";
    }
    await db
      .update(tileAds)
      .set({
        text: v.text,
        url: v.url,
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(tileAds.userId, session.user.id));
  }

  return NextResponse.json({ ok: true, needsReview: v.needsReview });
}

/**
 * Deactivate (hide) the current ad without deleting it. Doesn't refund.
 */
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("unauthorized", { status: 401 });

  await db
    .update(tileAds)
    .set({ status: "draft", updatedAt: new Date() })
    .where(eq(tileAds.userId, session.user.id));

  return new NextResponse(null, { status: 204 });
}
