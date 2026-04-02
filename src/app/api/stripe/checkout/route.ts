import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/config";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";

/**
 * Price ID mapping — set these env vars in Vercel:
 * STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_ANNUAL,
 * STRIPE_PRICE_ELITE_MONTHLY, STRIPE_PRICE_ELITE_ANNUAL
 */
function getPriceId(plan: string, billing: string): string | null {
  const key = `STRIPE_PRICE_${plan.toUpperCase()}_${billing.toUpperCase()}`;
  return process.env[key] ?? null;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const plan = body.plan ?? "pro";
  const billing = body.billing ?? "monthly";

  const priceId = getPriceId(plan, billing);
  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe pricing not configured. Contact support." },
      { status: 500 },
    );
  }

  const stripe = getStripe();

  // Get or create Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await db.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const { origin } = req.nextUrl;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/settings?upgraded=true`,
    cancel_url: `${origin}/settings`,
    metadata: { userId: user.id, plan },
  });

  return NextResponse.json({ url: session.url });
}
