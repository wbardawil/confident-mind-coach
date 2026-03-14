/**
 * Fail-fast environment variable validation.
 *
 * Called at build time (next.config.mjs) and can be imported at runtime.
 * Throws with a clear, actionable message listing every missing variable.
 */

const REQUIRED_ENV = [
  "DATABASE_URL",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "ANTHROPIC_API_KEY",
] as const;

export interface EnvCheckResult {
  valid: boolean;
  missing: string[];
}

export function checkEnv(): EnvCheckResult {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]?.trim());
  return { valid: missing.length === 0, missing };
}

/**
 * Throws if any required env vars are missing.
 * Call this at startup to fail fast instead of crashing deep in a call stack.
 */
export function assertEnv(): void {
  const { valid, missing } = checkEnv();
  if (!valid) {
    throw new Error(
      `Missing required environment variable${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. ` +
        "Add them to .env.local (development) or your hosting provider's environment settings (production).",
    );
  }
}
