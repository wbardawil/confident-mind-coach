/**
 * Fire-and-forget AI usage logging.
 *
 * Logs every Anthropic API call with token counts, computed cost,
 * latency, and error status. Never blocks the user-facing response.
 */

import { db } from "@/lib/utils/db";

// ─── Anthropic pricing (per million tokens, in dollars) ──

const PRICING: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  "claude-haiku-4-5-20251001":  { input: 0.80,  output: 4.00,  cacheRead: 0.08,  cacheWrite: 1.00 },
  "claude-3-5-sonnet-20241022": { input: 3.00,  output: 15.00, cacheRead: 0.30,  cacheWrite: 3.75 },
  "claude-sonnet-4-20250514":   { input: 3.00,  output: 15.00, cacheRead: 0.30,  cacheWrite: 3.75 },
  "claude-opus-4-20250514":     { input: 15.00, output: 75.00, cacheRead: 1.50,  cacheWrite: 18.75 },
};

const DEFAULT_PRICING = { input: 3.00, output: 15.00, cacheRead: 0.30, cacheWrite: 3.75 };

// ─── Cost calculation ──

function computeCostCents(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number,
  cacheWriteTokens: number,
): number {
  const p = PRICING[model] ?? DEFAULT_PRICING;
  const costDollars =
    (inputTokens * p.input +
      outputTokens * p.output +
      cacheReadTokens * p.cacheRead +
      cacheWriteTokens * p.cacheWrite) /
    1_000_000;
  return Math.round(costDollars * 100 * 10000) / 10000; // cents, 4 decimal places
}

// ─── Public API ──

export interface UsageLogInput {
  userId: string;
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  latencyMs: number;
  success?: boolean;
  errorType?: string;
}

/**
 * Log an AI API call. Fire-and-forget — errors are silently caught.
 */
export function logUsage(input: UsageLogInput): void {
  const cacheRead = input.cacheReadTokens ?? 0;
  const cacheWrite = input.cacheWriteTokens ?? 0;
  const costCents = computeCostCents(
    input.model,
    input.inputTokens,
    input.outputTokens,
    cacheRead,
    cacheWrite,
  );

  db.usageLog
    .create({
      data: {
        userId: input.userId,
        feature: input.feature,
        model: input.model,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        cacheReadTokens: cacheRead,
        cacheWriteTokens: cacheWrite,
        costCents,
        latencyMs: input.latencyMs,
        success: input.success ?? true,
        errorType: input.errorType ?? null,
      },
    })
    .catch((err) => {
      console.error("Usage log write failed:", err);
    });
}
