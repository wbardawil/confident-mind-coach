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

// ─── Pricing Tiers ────────────────────────────

export const PLANS = {
  free: {
    name: "Free",
    description: "Start building confidence",
    features: [
      "3 coaching sessions per day",
      "All coaching flows (ESP, Pregame, Reset, AAR)",
      "Top Ten achievement memory",
      "1 active Challenge",
      "Basic Confidence Ledger",
      "Haiku model",
    ],
  },
  pro: {
    name: "Pro",
    monthlyPrice: "$12.99/month",
    annualPrice: "$8.99/month (billed annually)",
    features: [
      "Everything in Free",
      "Unlimited coaching sessions",
      "Sonnet 3.5 and Sonnet 4 models",
      "Conversational coach with full memory",
      "Instant Reset (panic button)",
      "Multi-language coaching",
      "Full Confidence Ledger with trends",
      "Unlimited Challenges",
      "Document uploads",
      "Goal tracking with efficacy scoring",
    ],
  },
  elite: {
    name: "Elite",
    monthlyPrice: "$29.99/month",
    annualPrice: "$24.99/month (billed annually)",
    features: [
      "Everything in Pro",
      "Opus 4 model access",
      "Confidence DNA (coming soon)",
      "Exportable progress reports (coming soon)",
      "Priority AI responses",
    ],
  },
} as const;

export type PlanTier = "free" | "pro" | "elite";

// ─── Model Gating ─────────────────────────────

const TIER_MODELS: Record<PlanTier, string[]> = {
  free: ["haiku-4.5"],
  pro: ["haiku-4.5", "sonnet-3.5", "sonnet-4"],
  elite: ["haiku-4.5", "sonnet-3.5", "sonnet-4", "opus-3"],
};

export function getAllowedModels(tier: string): string[] {
  return TIER_MODELS[tier as PlanTier] ?? TIER_MODELS.free;
}

export function isModelAllowed(tier: string, model: string): boolean {
  return getAllowedModels(tier).includes(model);
}

// ─── Feature Gating ───────────────────────────

const FREE_DAILY_SESSION_LIMIT = 3;

export function getSessionLimit(tier: string): number {
  return tier === "free" ? FREE_DAILY_SESSION_LIMIT : Infinity;
}

/** Features gated behind Pro or higher */
export function requiresPro(feature: string): boolean {
  const proFeatures = [
    "coach",
    "instant-reset",
    "documents",
    "multi-language",
    "unlimited-sessions",
    "ledger-trends",
  ];
  return proFeatures.includes(feature);
}

/** Features gated behind Elite */
export function requiresElite(feature: string): boolean {
  const eliteFeatures = ["opus", "confidence-dna", "export-reports"];
  return eliteFeatures.includes(feature);
}
