/**
 * Checks whether Clerk environment variables are configured with real values.
 * Returns false when keys are missing, empty, or still contain placeholder text.
 * This lets local dev boot without valid Clerk credentials.
 */
export function isClerkConfigured(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const secretKey = process.env.CLERK_SECRET_KEY ?? "";

  // Must start with the expected prefix and not contain placeholder dots
  const hasPublishable =
    publishableKey.startsWith("pk_") && !publishableKey.includes("...");
  const hasSecret =
    secretKey.startsWith("sk_") && !secretKey.includes("...");

  return hasPublishable && hasSecret;
}
