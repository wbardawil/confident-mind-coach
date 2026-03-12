/**
 * Rule-based distress signal detector for Reset flow.
 *
 * Scans emotional-state text for keywords that indicate a confidence
 * setback worth recording as a ledger withdrawal. This is NOT a crisis
 * detector (that lives in lib/safety/crisis-detect.ts) — it only captures
 * moderate distress signals tied to performance confidence.
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
 * Scan one or more text inputs for distress signals.
 *
 * Returns a withdrawal score capped at −2 (never more extreme than that).
 */
export function detectDistress(inputs: string[]): DistressResult {
  const combined = inputs.join(" ");
  const matched: string[] = [];
  let totalWeight = 0;

  for (const signal of DISTRESS_SIGNALS) {
    if (signal.pattern.test(combined)) {
      matched.push(signal.label);
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
