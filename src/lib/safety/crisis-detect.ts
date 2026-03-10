/**
 * Server-side crisis detection.
 *
 * Scans user input for language that suggests self-harm, suicidal ideation,
 * or acute crisis distress.  When triggered the system must:
 *   1. Stop normal coaching
 *   2. Show a supportive escalation message
 *   3. Encourage professional support
 *   4. Log the session as flagged
 *
 * This is a keyword / pattern scanner — not a clinical tool.
 */

const CRISIS_PATTERNS: RegExp[] = [
  // suicidal ideation
  /\b(kill\s*(my|him|her|them)?self|suicide|suicidal)\b/i,
  /\b(want(ing)?\s+to\s+die|wish\s+i\s+was\s+dead)\b/i,
  /\b(end\s+(my|it\s+all|everything))\b/i,
  /\b(no\s+reason\s+to\s+live)\b/i,

  // self-harm
  /\b(self[- ]?harm|cut(ting)?\s+my(self)?|hurt(ing)?\s+my(self)?)\b/i,

  // crisis distress
  /\b(can'?t\s+go\s+on|give\s+up\s+on\s+life)\b/i,
  /\b(better\s+off\s+(dead|without\s+me))\b/i,
  /\b(nobody\s+(would\s+)?care\s+if\s+i)\b/i,
];

export interface SafetyScanResult {
  flagged: boolean;
  reason: string | null;
}

/**
 * Scan one or more strings for crisis signals.
 * Returns { flagged: true, reason } if any pattern matches.
 */
export function scanForCrisis(texts: string[]): SafetyScanResult {
  const combined = texts.join(" ");

  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(combined)) {
      return {
        flagged: true,
        reason: `Crisis keyword detected: matched pattern ${pattern.source}`,
      };
    }
  }

  return { flagged: false, reason: null };
}
