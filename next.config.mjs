// Fail fast if required environment variables are missing.
// This runs at build time AND at dev-server startup.
import { assertEnv } from "./src/lib/utils/check-env.ts";

try {
  assertEnv();
} catch (e) {
  // In CI/build the error is fatal. In dev, warn loudly but allow
  // partial startup so devs can work on UI without all keys set.
  if (process.env.NODE_ENV === "production") {
    throw e;
  }
  console.warn(`\n⚠️  ${e.message}\n`);
}

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
