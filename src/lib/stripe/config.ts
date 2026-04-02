import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  _stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
  return _stripe;
}

/**
 * Pricing configuration.
 * Set STRIPE_PRICE_PRO in env to your Stripe Price ID.
 */
export const PLANS = {
  free: {
    name: "Free",
    description: "Basic coaching with Haiku",
    features: [
      "Daily ESP reflections",
      "All coaching flows (Pregame, Reset, AAR)",
      "Confidence Ledger",
      "Top Ten memory bank",
      "Goals tracking",
      "Haiku model only",
    ],
  },
  pro: {
    name: "Pro",
    description: "Full coaching experience",
    price: "$29/month",
    features: [
      "Everything in Free",
      "Sonnet 3.5, Sonnet 4, and Opus 3 models",
      "Conversational coach with full memory",
      "Document uploads for coaching context",
      "Multi-language coaching",
      "Priority support",
    ],
  },
} as const;

export type PlanTier = keyof typeof PLANS;

/** Check if a feature requires Pro. */
export function requiresPro(feature: string): boolean {
  const proFeatures = [
    "sonnet",
    "opus",
    "coach",
    "documents",
    "multi-language",
  ];
  return proFeatures.includes(feature);
}
