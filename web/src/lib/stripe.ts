import Stripe from "stripe";

let cached: Stripe | null = null;

export function stripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  cached = new Stripe(key);
  return cached;
}

export function getPriceId(): string {
  const id = process.env.STRIPE_PRICE_TILE_AD;
  if (!id) throw new Error("STRIPE_PRICE_TILE_AD not set");
  return id;
}

export function getWebhookSecret(): string {
  const s = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s) throw new Error("STRIPE_WEBHOOK_SECRET not set");
  return s;
}
