/**
 * Rule-based distress signal detector for Reset flow.
 *
 * Scans emotional-state text for keywords AND the self-reported confidence
 * score to determine whether a confidence setback is worth recording as a
 * ledger withdrawal. This is NOT a crisis detector (that lives in
 * lib/safety/crisis-detect.ts) — it only captures moderate distress
 * signals tied to performance confidence.
 *
 * Returns a small negative withdrawal score (−1 or −2) when signals are
 * found, or 0 when the text doesn't indicate significant distress.
 */

/** Individual signal with its weight. */
interface DistressSignal {
  pattern: RegExp;
  weight: number; // 1 = mild, 2 = stronger
  label: string;
}

const DISTRESS_SIGNALS: DistressSignal[] = [
  // ─── Stronger signals (weight 2) ────────────────
  { pattern: /\bpanic(k?(ed|ing))?\b/i, weight: 2, label: "panic" },
  { pattern: /\bfroze\b/i, weight: 2, label: "froze" },
  { pattern: /\bshame(d|ful)?\b/i, weight: 2, label: "shame" },
  { pattern: /\bhumiliat(ed|ing|ion)\b/i, weight: 2, label: "humiliation" },
  { pattern: /\bspiral(l?ing)?\b/i, weight: 2, label: "spiraling" },
  { pattern: /\bshut\s*down\b/i, weight: 2, label: "shut down" },
  { pattern: /\bchok(e[ds]?|ing)\b/i, weight: 2, label: "choked" },
  { pattern: /\bdevastat(ed|ing)?\b/i, weight: 2, label: "devastated" },
  { pattern: /\bcrushed\b/i, weight: 2, label: "crushed" },
  { pattern: /\bhopeless(ness)?\b/i, weight: 2, label: "hopeless" },
  { pattern: /\bworthless(ness)?\b/i, weight: 2, label: "worthless" },

  // ─── Milder signals (weight 1) ──────────────────
  { pattern: /\boverwhelm(ed|ing)?\b/i, weight: 1, label: "overwhelmed" },
  { pattern: /\bembarrass(ed|ing|ment)?\b/i, weight: 1, label: "embarrassed" },
  { pattern: /\banxious\b/i, weight: 1, label: "anxious" },
  { pattern: /\bfailed\b/i, weight: 1, label: "failed" },
  { pattern: /\bfailure\b/i, weight: 1, label: "failure" },
  { pattern: /\bdoubt(ed|ing)?\b/i, weight: 1, label: "doubt" },
  { pattern: /\binsecure\b/i, weight: 1, label: "insecure" },
  { pattern: /\bnervous\b/i, weight: 1, label: "nervous" },
  { pattern: /\bdread(ed|ing)?\b/i, weight: 1, label: "dread" },
  { pattern: /\bself[- ]?doubt\b/i, weight: 1, label: "self-doubt" },
  { pattern: /\blost\s+confiden(ce|t)\b/i, weight: 1, label: "lost confidence" },
  { pattern: /\blos(er|s|t)\b/i, weight: 1, label: "loser" },
  { pattern: /\bloose?r\b/i, weight: 1, label: "loser" }, // common misspelling
  { pattern: /\bdefeated\b/i, weight: 1, label: "defeated" },
  { pattern: /\bhelpless(ness)?\b/i, weight: 1, label: "helpless" },
  { pattern: /\bdisaster\b/i, weight: 1, label: "disaster" },
  { pattern: /\bterrible\b/i, weight: 1, label: "terrible" },
  { pattern: /\bawful\b/i, weight: 1, label: "awful" },
  { pattern: /\bmess(ed)?\s+up\b/i, weight: 1, label: "messed up" },
  { pattern: /\bblew\s+it\b/i, weight: 1, label: "blew it" },
  { pattern: /\bbombed\b/i, weight: 1, label: "bombed" },
];

export interface DistressResult {
  /** Whether any distress signals were found. */
  detected: boolean;
  /** Suggested withdrawal score (0, −1, or −2). */
  withdrawalScore: number;
  /** Labels of matched signals, for the ledger description. */
  matchedSignals: string[];
}

/**
 * Structured input for distress detection.
 * All fields are optional/nullable so callers never need to pre-filter.
 */
export interface DetectDistressInput {
  eventDescription?: string | null;
  emotionalState?: string | null;
  confidenceScore?: number | null;
}

/**
 * Scan event description, emotional state text, and confidence score
 * for distress signals.
 *
 * Confidence 1 is treated as a strong signal (weight 2).
 * Confidence 2–3 is treated as a mild signal (weight 1).
 * Confidence 4–6 is neutral (draw). Confidence 7–10 is deposit territory.
 *
 * Returns a withdrawal score capped at −2 (never more extreme than that).
 */
export function detectDistress(input: DetectDistressInput): DistressResult {
  // ── Safely combine text fields, filtering out null/undefined/empty ──
  const textParts: string[] = [];
  if (input.eventDescription) textParts.push(input.eventDescription);
  if (input.emotionalState) textParts.push(input.emotionalState);
  const combined = textParts.join(" ");

  const matched: string[] = [];
  let totalWeight = 0;

  // ── Confidence score as a signal ────────────────
  // 1–3 = withdrawal territory, 4–6 = neutral, 7–10 = deposit territory
  // Defensive: only process if it's actually a number
  const score =
    typeof input.confidenceScore === "number" && !Number.isNaN(input.confidenceScore)
      ? input.confidenceScore
      : null;

  if (score != null) {
    if (score <= 1) {
      matched.push("very low confidence");
      totalWeight += 2;
    } else if (score <= 3) {
      matched.push("low confidence");
      totalWeight += 1;
    }
  }

  // ── Text-based keyword signals ──────────────────
  for (const signal of DISTRESS_SIGNALS) {
    if (signal.pattern.test(combined)) {
      // Avoid duplicate labels (e.g. "loser" pattern + misspelling pattern)
      if (!matched.includes(signal.label)) {
        matched.push(signal.label);
      }
      totalWeight += signal.weight;
    }
  }

  if (matched.length === 0) {
    return { detected: false, withdrawalScore: 0, matchedSignals: [] };
  }

  // Map total weight → withdrawal score: 1 → −1, 2+ → −2
  const withdrawalScore = totalWeight >= 2 ? -2 : -1;

  return {
    detected: true,
    withdrawalScore,
    matchedSignals: matched,
  };
}
