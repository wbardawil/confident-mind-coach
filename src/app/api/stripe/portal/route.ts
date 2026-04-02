import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/config";
import { getCurrentUser } from "@/lib/utils/user";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.stripeCustomerId) {
    return NextResponse.json(
      { error: "No subscription found" },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const { origin } = req.nextUrl;

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/settings`,
  });

  return NextResponse.json({ url: session.url });
}
