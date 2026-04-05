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
//
// Confident     $9.99/mo   All structured flows, no chat
// Coach        $29.99/mo   + Haiku chat, 900 msgs/mo
// Pro Coach    $79.99/mo   + Sonnet 4 chat, 900 msgs/mo
// Elite Coach $179.99/mo   + Opus 4 chat, 450 msgs/mo
//
// Margins at max usage: 80% / 76% / 75%

export const PLANS = {
  free: {
    name: "Free Trial",
    description: "7-day trial to explore structured coaching",
    monthlyPrice: null,
    features: [
      "3 coaching sessions per day",
      "ESP, Pregame, Reset, AAR flows",
      "Top Ten achievement memory",
      "Basic Confidence Ledger",
      "7-day access",
    ],
  },
  confident: {
    name: "Confident",
    description: "Structured confidence training system",
    monthlyPrice: "$9.99/month",
    annualPrice: "$7.99/month (billed annually)",
    features: [
      "Unlimited structured coaching flows",
      "Top Ten, Ledger, Goals, Vision, Systems",
      "Challenges with coaching feedback",
      "Document uploads",
      "Multi-language coaching",
    ],
  },
  coach: {
    name: "Confident + Coach",
    description: "Add a personal AI coach powered by Haiku",
    monthlyPrice: "$29.99/month",
    annualPrice: "$24.99/month (billed annually)",
    features: [
      "Everything in Confident",
      "Conversational AI coach (Haiku 4.5)",
      "900 chat messages per month",
      "Instant Reset (panic button)",
      "20 sessions of coaching memory",
      "30-day free chat trial",
    ],
  },
  pro: {
    name: "Confident + Pro Coach",
    description: "Premium AI coaching powered by Sonnet 4",
    monthlyPrice: "$79.99/month",
    annualPrice: "$59.99/month (billed annually)",
    features: [
      "Everything in Coach",
      "Sonnet 4 model (deeper, more nuanced)",
      "900 chat messages per month",
      "30 sessions of coaching memory",
    ],
  },
  elite: {
    name: "Confident + Elite Coach",
    description: "The best AI coaching available, powered by Opus 4",
    monthlyPrice: "$179.99/month",
    annualPrice: "$149.99/month (billed annually)",
    features: [
      "Everything in Pro Coach",
      "Opus 4 model (therapist-grade quality)",
      "450 chat messages per month",
      "40 sessions of coaching memory",
      "Priority AI responses",
    ],
  },
} as const;

export type PlanTier = "free" | "confident" | "coach" | "pro" | "elite";

// ─── Model Gating ─────────────────────────────

const TIER_MODELS: Record<PlanTier, string[]> = {
  free: ["haiku-4.5"],
  confident: ["haiku-4.5"], // structured flows only
  coach: ["haiku-4.5"],
  pro: ["haiku-4.5", "sonnet-3.5", "sonnet-4"],
  elite: ["haiku-4.5", "sonnet-3.5", "sonnet-4", "opus-3"],
};

export function getAllowedModels(tier: string): string[] {
  return TIER_MODELS[tier as PlanTier] ?? TIER_MODELS.free;
}

export function isModelAllowed(tier: string, model: string): boolean {
  return getAllowedModels(tier).includes(model);
}

// ─── Chat Access ─────────────────────────────

/** Tiers that include conversational coach access. */
const CHAT_TIERS: PlanTier[] = ["coach", "pro", "elite"];

/** Trial users on Confident plan get 100 free chat messages. */
const TRIAL_TIERS: PlanTier[] = ["confident"];
const TRIAL_MESSAGE_CAP = 100;

export function hasChatAccess(tier: string): boolean {
  return CHAT_TIERS.includes(tier as PlanTier) || TRIAL_TIERS.includes(tier as PlanTier);
}

export function isChatTrial(tier: string): boolean {
  return TRIAL_TIERS.includes(tier as PlanTier);
}

// ─── Message Caps ─────────────────────────────
//
// Caps sized for 2 sessions/day (heavy user) at 75%+ margin.
// Opus capped at 1/day due to cost — each session is deeper.

const MONTHLY_MESSAGE_CAPS: Record<PlanTier, number> = {
  free: 0,
  confident: TRIAL_MESSAGE_CAP, // 30-day free trial (100 msgs)
  coach: 900,                   // ~60 sessions of 15 msgs (2/day)
  pro: 900,                     // ~60 sessions of 15 msgs (2/day)
  elite: 450,                   // ~30 sessions of 15 msgs (1/day)
};

export function getMonthlyMessageCap(tier: string): number {
  return MONTHLY_MESSAGE_CAPS[tier as PlanTier] ?? 0;
}

// ─── Session Limits (structured flows) ────────

const STRUCTURED_SESSION_LIMITS: Record<PlanTier, number> = {
  free: 3,
  confident: Infinity,
  coach: Infinity,
  pro: Infinity,
  elite: Infinity,
};

export function getSessionLimit(tier: string): number {
  return STRUCTURED_SESSION_LIMITS[tier as PlanTier] ?? 3;
}

// ─── Memory Depth ─────────────────────────────

export const MEMORY_DEPTH_BY_TIER: Record<PlanTier, { sessions: number; esp: number; aar: number; journal: number }> = {
  free: { sessions: 0, esp: 5, aar: 3, journal: 5 },
  confident: { sessions: 0, esp: 10, aar: 5, journal: 10 },
  coach: { sessions: 20, esp: 20, aar: 10, journal: 30 },
  pro: { sessions: 30, esp: 30, aar: 15, journal: 50 },
  elite: { sessions: 40, esp: 50, aar: 20, journal: 100 },
};

// ─── Feature Gating ───────────────────────────

/** Features that require at least the Confident plan. */
export function requiresConfident(feature: string): boolean {
  const features = [
    "unlimited-sessions",
    "documents",
    "multi-language",
    "challenges",
    "vision",
    "systems",
  ];
  return features.includes(feature);
}

/** Features that require a chat plan (Coach+). */
export function requiresChat(feature: string): boolean {
  const features = ["coach", "instant-reset"];
  return features.includes(feature);
}
