/**
 * Session summary generator.
 *
 * After a chat session has a meaningful exchange, Haiku generates a
 * factual summary capturing key details: names, relationships, stories,
 * emotions, commitments, and action items. This summary replaces raw
 * transcripts in the coaching memory, cutting token costs by ~90%.
 *
 * Accuracy is critical — the summary is the coach's memory. If it
 * says "father" the coach will say "father"; if it says "father-in-law"
 * the coach will say "father-in-law".
 */

import { db } from "@/lib/utils/db";
import { generateCoaching } from "@/lib/ai/client";

const SUMMARY_PROMPT = `You are a note-taking assistant for a mental performance coach. Your job is to write a precise, factual summary of a coaching conversation.

RULES:
- Capture EXACT names, relationships, and roles mentioned (father, not father-in-law; Sarah, not Sara)
- Record specific stories, events, and situations discussed
- Note emotional states and shifts during the conversation
- List any commitments, action items, or homework given
- Include key coaching insights or breakthroughs
- Note any recurring themes or patterns mentioned
- Be specific about dates, timeframes, and context if mentioned
- Write in third person ("The client discussed..." / "They mentioned...")
- Keep it under 400 words — dense with facts, no filler
- Do NOT interpret or add information not present in the conversation

Return ONLY the summary text, no headers or formatting.`;

/**
 * Generate and store a session summary. Fire-and-forget.
 * Only runs if the session has 4+ messages and no existing summary.
 */
export async function generateSessionSummary(sessionId: string): Promise<void> {
  try {
    const session = await db.chatSession.findUnique({
      where: { id: sessionId },
      select: {
        summary: true,
        messages: {
          orderBy: { createdAt: "asc" },
          select: { role: true, content: true },
        },
      },
    });

    if (!session) return;
    if (session.summary) return; // already summarized
    if (session.messages.length < 4) return; // too short to summarize

    // Build the conversation transcript for summarization
    const transcript = session.messages
      .map((m) => `${m.role === "user" ? "Client" : "Coach"}: ${m.content}`)
      .join("\n\n");

    const aiResult = await generateCoaching({
      systemPrompt: SUMMARY_PROMPT,
      userMessage: transcript,
      maxTokens: 800,
      temperature: 0.2, // low temp for factual accuracy
    });

    const summary = aiResult.text.trim();
    if (summary.length > 50) {
      await db.chatSession.update({
        where: { id: sessionId },
        data: { summary },
      });
    }
  } catch (err) {
    console.error("Session summary generation failed:", err);
  }
}

/**
 * Regenerate summary for a session (e.g. after more messages are added).
 * Clears existing summary first so it gets regenerated fresh.
 */
export async function refreshSessionSummary(sessionId: string): Promise<void> {
  try {
    await db.chatSession.update({
      where: { id: sessionId },
      data: { summary: null },
    });
    await generateSessionSummary(sessionId);
  } catch (err) {
    console.error("Session summary refresh failed:", err);
  }
}
