import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/config";
import { db } from "@/lib/utils/db";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: "Missing webhook config" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId && session.subscription) {
        await db.user.update({
          where: { id: userId },
          data: {
            subscriptionTier: session.metadata?.plan === "elite" ? "elite" : "pro",
            subscriptionId: session.subscription as string,
            subscriptionStatus: "active",
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status;
      const isActive = status === "active" || status === "trialing";

      if (isActive) {
        // Keep current tier (pro or elite), just update status
        await db.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionStatus: status },
        });
      } else {
        // Downgrade to free on cancel/past_due
        await db.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionTier: "free", subscriptionStatus: status },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await db.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          subscriptionTier: "free",
          subscriptionId: null,
          subscriptionStatus: "canceled",
        },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
