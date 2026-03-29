/**
 * Checks whether Clerk environment variables are configured with real values.
 * Returns false when keys are missing, empty, or still contain placeholder text.
 * This lets local dev boot without valid Clerk credentials.
 */
export function isClerkConfigured(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const secretKey = process.env.CLERK_SECRET_KEY ?? "";

  // Must start with the expected prefix, not contain placeholder text,
  // and be long enough to be a real key (real Clerk keys are 50+ chars)
  const isReal = (key: string, prefix: string) =>
    key.startsWith(prefix) &&
    !key.includes("...") &&
    !key.includes("placeholder") &&
    key.length > 30;

  return isReal(publishableKey, "pk_") && isReal(secretKey, "sk_");
}
