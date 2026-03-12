/**
 * Convert raw AI/API errors into user-friendly messages.
 *
 * Keeps technical details out of the UI while still surfacing
 * actionable information.
 */
export function friendlyAiError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (lower.includes("credit balance") || lower.includes("billing")) {
    return "The coaching service is temporarily unavailable due to a billing issue. Please try again later.";
  }

  if (lower.includes("rate limit") || lower.includes("429")) {
    return "The coaching service is busy right now. Please wait a moment and try again.";
  }

  if (lower.includes("overloaded") || lower.includes("503")) {
    return "The coaching service is experiencing high demand. Please try again in a few minutes.";
  }

  if (lower.includes("not_found") || lower.includes("404")) {
    return "The coaching service encountered a configuration issue. Please contact support.";
  }

  if (lower.includes("api_key") || lower.includes("authentication") || lower.includes("401")) {
    return "The coaching service is not properly configured. Please check your API key.";
  }

  if (lower.includes("timeout") || lower.includes("network") || lower.includes("502") || lower.includes("504")) {
    return "Could not reach the coaching service. Please check your connection and try again.";
  }

  return "Something went wrong with the coaching service. Please try again.";
}
