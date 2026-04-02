import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/config";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRICE_PRO;
  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe pricing not configured" },
      { status: 500 },
    );
  }

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
    metadata: { userId: user.id },
  });

  return NextResponse.json({ url: session.url });
}
