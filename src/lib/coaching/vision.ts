/**
 * Vision coaching utilities.
 *
 * AI gap analysis for 10x vision domains, and context builder
 * for injecting vision data into coaching prompts.
 */

import { z } from "zod";
import { db } from "@/lib/utils/db";
import { generateCoaching } from "@/lib/ai/client";
import { parseAiResponse } from "@/lib/ai/parse";
import { getVisionDomainLabel } from "@/lib/validators/vision";

// ─── Gap analysis ────────────────────────────────

const gapAnalysisSchema = z.object({
  gap: z.string().min(1).max(2000),
});

/**
 * Generate an AI gap analysis between current state and 10x vision.
 * Fire-and-forget — stores result directly in DB.
 */
export async function generateGapAnalysis(
  visionDomainId: string,
  domain: string,
  vision: string,
  currentState: string,
): Promise<void> {
  const domainLabel = domain;

  const prompt = {
    systemPrompt: `You are a strategic coach analyzing the gap between someone's current state and their 10x vision.

Your job: Write a concise, honest, actionable gap analysis (3-5 sentences). Be specific about:
- The biggest gaps between where they are and where they want to be
- What capabilities, resources, or mindset shifts are needed
- Which gap to close first

Be direct. No fluff. No platitudes. Write like a coach who respects their ambition.

Return ONLY valid JSON: { "gap": "your analysis here" }`,
    userMessage: `Domain: ${domainLabel}

Their 10x vision:
${vision}

Where they are now:
${currentState}`,
    maxTokens: 500,
    temperature: 0.4,
  };

  try {
    const raw = await generateCoaching(prompt);
    const result = parseAiResponse(raw, gapAnalysisSchema);
    if (result.success) {
      await db.visionDomain.update({
        where: { id: visionDomainId },
        data: { gap: result.data.gap },
      });
    }
  } catch (err) {
    console.error("Gap analysis generation failed:", err);
  }
}

// ─── Context builder ─────────────────────────────

/**
 * Build a coaching-ready context string from all of a user's vision domains.
 * Returns empty string if no visions exist.
 */
export async function getVisionContext(userId: string): Promise<string> {
  const visions = await db.visionDomain.findMany({
    where: { userId, status: "active" },
    orderBy: { priority: "asc" },
    select: {
      domain: true,
      customLabel: true,
      vision: true,
      currentState: true,
      gap: true,
      priority: true,
    },
  });

  if (visions.length === 0) return "";

  const blocks = visions.map((v, i) => {
    const label = getVisionDomainLabel(v.domain, v.customLabel);
    const isPrimary = i === 0;
    const header = `### ${label}${isPrimary ? " (primary focus)" : ""}`;
    const lines = [`${header}\n`, `**10x Vision:** ${v.vision}`];
    if (v.currentState) lines.push(`**Current state:** ${v.currentState}`);
    if (v.gap) lines.push(`**Gap analysis:** ${v.gap}`);
    return lines.join("\n");
  });

  return `## 10x Vision

This person's North Star — what they're building toward at 10x scale. All coaching should connect daily work back to this vision when relevant. The first domain listed is their primary focus.

${blocks.join("\n\n---\n\n")}`;
}
