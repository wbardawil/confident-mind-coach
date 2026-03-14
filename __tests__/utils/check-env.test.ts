import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { checkEnv, assertEnv } from "@/lib/utils/check-env";

describe("checkEnv", () => {
  const REQUIRED_KEYS = [
    "DATABASE_URL",
    "CLERK_SECRET_KEY",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "ANTHROPIC_API_KEY",
  ];

  // Save originals so we can restore after each test
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const key of REQUIRED_KEYS) {
      saved[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const key of REQUIRED_KEYS) {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    }
  });

  function setAllEnv() {
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.CLERK_SECRET_KEY = "sk_test_123";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_123";
    process.env.ANTHROPIC_API_KEY = "sk-ant-test-123";
  }

  it("returns valid when all required variables are set", () => {
    setAllEnv();
    const result = checkEnv();
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("reports missing DATABASE_URL", () => {
    setAllEnv();
    delete process.env.DATABASE_URL;
    const result = checkEnv();
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("DATABASE_URL");
  });

  it("reports missing ANTHROPIC_API_KEY", () => {
    setAllEnv();
    delete process.env.ANTHROPIC_API_KEY;
    const result = checkEnv();
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("ANTHROPIC_API_KEY");
  });

  it("reports all missing when none are set", () => {
    for (const key of REQUIRED_KEYS) {
      delete process.env[key];
    }
    const result = checkEnv();
    expect(result.valid).toBe(false);
    expect(result.missing).toHaveLength(4);
    for (const key of REQUIRED_KEYS) {
      expect(result.missing).toContain(key);
    }
  });

  it("rejects empty string as missing", () => {
    setAllEnv();
    process.env.ANTHROPIC_API_KEY = "";
    const result = checkEnv();
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("ANTHROPIC_API_KEY");
  });

  it("rejects whitespace-only as missing", () => {
    setAllEnv();
    process.env.DATABASE_URL = "   ";
    const result = checkEnv();
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("DATABASE_URL");
  });
});

describe("assertEnv", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const key of ["DATABASE_URL", "CLERK_SECRET_KEY", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "ANTHROPIC_API_KEY"]) {
      saved[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const [key, val] of Object.entries(saved)) {
      if (val === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = val;
      }
    }
  });

  it("does not throw when all vars are set", () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.CLERK_SECRET_KEY = "sk_test_123";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_123";
    process.env.ANTHROPIC_API_KEY = "sk-ant-test-123";
    expect(() => assertEnv()).not.toThrow();
  });

  it("throws with clear message listing missing vars", () => {
    delete process.env.DATABASE_URL;
    delete process.env.ANTHROPIC_API_KEY;
    process.env.CLERK_SECRET_KEY = "sk_test_123";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_123";

    expect(() => assertEnv()).toThrow("Missing required environment variables: DATABASE_URL, ANTHROPIC_API_KEY");
  });

  it("singular grammar when one var is missing", () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.CLERK_SECRET_KEY = "sk_test_123";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_123";
    delete process.env.ANTHROPIC_API_KEY;

    expect(() => assertEnv()).toThrow("Missing required environment variable: ANTHROPIC_API_KEY");
  });
});
