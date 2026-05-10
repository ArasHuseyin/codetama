import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { tileAds } from "@/db/schema";
import { stripe, getPriceId } from "@/lib/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("unauthorized", { status: 401 });

  const [existing] = await db.select().from(tileAds).where(eq(tileAds.userId, session.user.id)).limit(1);

  if (existing?.status === "active" || existing?.status === "pending_review") {
    return new NextResponse("already paid", { status: 409 });
  }

  if (!existing || (!existing.text && !existing.url)) {
    return new NextResponse("set text or url first", { status: 400 });
  }

  const origin = process.env.AUTH_URL ?? "https://codetama.com";

  const checkoutSession = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: getPriceId(), quantity: 1 }],
    success_url: `${origin}/profile?ad=success`,
    cancel_url: `${origin}/profile?ad=canceled`,
    client_reference_id: session.user.id,
    metadata: {
      userId: session.user.id,
      product: "tile_ad",
    },
    customer_email: session.user.email ?? undefined,
    automatic_tax: { enabled: true },
    billing_address_collection: "auto",
  });

  await db
    .update(tileAds)
    .set({
      status: "pending_payment",
      stripeSessionId: checkoutSession.id,
      updatedAt: new Date(),
    })
    .where(eq(tileAds.userId, session.user.id));

  if (!checkoutSession.url) {
    return new NextResponse("checkout url missing", { status: 500 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
