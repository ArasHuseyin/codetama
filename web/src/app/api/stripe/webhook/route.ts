import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db/client";
import { tileAds } from "@/db/schema";
import { stripe, getWebhookSecret } from "@/lib/stripe";
import { validateTileAd } from "@/lib/tile-ad";

export const runtime = "nodejs";

/**
 * Stripe webhook handler. Verifies signature, then updates tile_ads on
 * checkout completion or refund.
 */
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("missing signature", { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, getWebhookSecret());
  } catch (e) {
    return new NextResponse(`signature verification failed: ${(e as Error).message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "charge.refunded":
      await handleRefund(event.data.object as Stripe.Charge);
      break;
    // Ignore other events for now
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id ?? session.metadata?.userId ?? null;
  if (!userId) {
    console.warn("[stripe webhook] checkout.completed without userId");
    return;
  }

  const [existing] = await db.select().from(tileAds).where(eq(tileAds.userId, userId)).limit(1);
  if (!existing) {
    console.warn(`[stripe webhook] no tile_ads row for user ${userId}`);
    return;
  }

  // Decide active vs pending_review based on URL whitelist.
  const v = validateTileAd(existing.text, existing.url);
  const status = v.ok && !v.needsReview ? "active" : v.ok ? "pending_review" : "pending_review";

  await db
    .update(tileAds)
    .set({
      status,
      paidAt: new Date(),
      stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
      stripeSessionId: session.id,
      updatedAt: new Date(),
    })
    .where(eq(tileAds.userId, userId));
}

async function handleRefund(charge: Stripe.Charge) {
  const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
  if (!piId) return;

  const [existing] = await db
    .select()
    .from(tileAds)
    .where(eq(tileAds.stripePaymentIntentId, piId))
    .limit(1);

  if (!existing) return;

  await db
    .update(tileAds)
    .set({
      status: "refunded",
      refundedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(tileAds.userId, existing.userId));
}
