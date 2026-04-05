/**
 * Zep-grade fact extraction and conflict resolution.
 *
 * After each chat session, Haiku extracts discrete facts from the
 * conversation. Facts are stored as entity-relationship triples with
 * temporal tracking. When a new fact contradicts an existing one,
 * the old fact is invalidated (not deleted) and the new one becomes
 * the source of truth.
 *
 * This gives the coach precise, individually verifiable memory at
 * ~50 tokens per fact instead of ~800 tokens per session summary.
 */

import { db } from "@/lib/utils/db";
import { generateCoaching } from "@/lib/ai/client";

// ─── Fact categories ────────────────────────────

export const FACT_CATEGORIES = [
  "person",       // people in the user's life (father, wife, boss "Sarah")
  "relationship", // how people relate (father is strict but supportive)
  "story",        // specific events/stories shared (childhood memory, big win)
  "goal",         // what they're working toward
  "commitment",   // promises made during coaching
  "preference",   // how they like to be coached, communication style
  "emotion",      // recurring emotional patterns
  "context",      // job, location, life situation
] as const;

// ─── Extraction prompt ──────────────────────────

const EXTRACTION_PROMPT = `You extract factual information from coaching conversations into structured facts.

RULES:
- Extract ONLY facts explicitly stated by the client. Never infer or assume.
- Be EXACT with names, relationships, and roles. If they say "my father", the subject is "user.father", NOT "user.father-in-law".
- Each fact must be independently meaningful — no "they discussed something".
- Categorize each fact: person, relationship, story, goal, commitment, preference, emotion, context
- Subject should be a dot-notation entity: "user", "user.father", "user.boss", "user.wife.Sarah", etc.
- Predicate should be a clear verb phrase: "works_as", "has_father_named", "told_story_about", "committed_to", "feels_anxious_about"
- Content should be the full detail in one concise sentence.
- Skip greetings, filler, and coaching methodology discussion — only extract personal facts.
- If no extractable facts exist, return an empty array.

Return ONLY valid JSON:
{
  "facts": [
    {
      "category": "person",
      "subject": "user.father",
      "predicate": "described_as",
      "content": "User's father was strict but deeply supportive during childhood"
    }
  ]
}`;

// ─── Conflict detection prompt ──────────────────

const CONFLICT_PROMPT = `You check if a new fact contradicts any existing facts about a person.

Given a NEW fact and a list of EXISTING facts, determine if the new fact:
1. CONTRADICTS an existing fact (return the IDs of contradicted facts)
2. UPDATES an existing fact with more detail (return IDs to supersede)
3. Is completely NEW (return empty array)

Rules:
- "My father" and "my father-in-law" are DIFFERENT people — not a contradiction.
- A job change IS a contradiction: "works as engineer" vs "works as manager" — old is superseded.
- More detail is NOT a contradiction: "has a daughter" → "has a daughter named Emma" — old is superseded with more detail.
- Emotional changes are NOT contradictions: "feels anxious" and "feels confident" can coexist at different times.

Return ONLY valid JSON:
{ "supersedes": ["fact_id_1", "fact_id_2"] }`;

// ─── Types ──────────────────────────────────────

interface ExtractedFact {
  category: string;
  subject: string;
  predicate: string;
  content: string;
}

interface ExtractionResult {
  facts: ExtractedFact[];
}

// ─── Extract facts from a session ───────────────

/**
 * Extract structured facts from a chat session and store them.
 * Runs conflict detection against existing facts.
 * Fire-and-forget — called after each chat response.
 */
export async function extractSessionFacts(
  sessionId: string,
  userId: string,
): Promise<void> {
  try {
    // Load the session messages
    const messages = await db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });

    if (messages.length < 4) return; // too short

    // Only extract from user messages (coach responses don't contain user facts)
    const userMessages = messages
      .filter((m) => m.role === "user")
      .map((m) => `Client: ${m.content}`)
      .join("\n\n");

    if (userMessages.length < 50) return; // too little content

    // Extract facts via Haiku
    const aiResult = await generateCoaching({
      systemPrompt: EXTRACTION_PROMPT,
      userMessage: userMessages,
      maxTokens: 600,
      temperature: 0.1, // very low for factual accuracy
    });
    const raw = aiResult.text;

    let result: ExtractionResult;
    try {
      result = JSON.parse(raw);
    } catch {
      // Try to extract JSON from the response
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return;
      result = JSON.parse(match[0]);
    }

    if (!result.facts || !Array.isArray(result.facts) || result.facts.length === 0) {
      return;
    }

    // Load existing active facts for conflict detection
    const existingFacts = await db.memoryFact.findMany({
      where: { userId, active: true },
      select: { id: true, category: true, subject: true, predicate: true, content: true },
    });

    // Process each extracted fact
    for (const fact of result.facts) {
      if (!fact.category || !fact.subject || !fact.predicate || !fact.content) continue;
      if (fact.content.length < 10 || fact.content.length > 500) continue;

      // Find facts with the same subject+predicate that might be superseded
      const relatedFacts = existingFacts.filter(
        (ef) => ef.subject === fact.subject && ef.predicate === fact.predicate,
      );

      if (relatedFacts.length > 0) {
        // Check if this is truly new or just a duplicate
        const isDuplicate = relatedFacts.some(
          (ef) => ef.content.toLowerCase() === fact.content.toLowerCase(),
        );
        if (isDuplicate) continue;

        // Run conflict detection for non-trivial overlaps
        const conflictResult = await detectConflicts(fact, relatedFacts);

        // Invalidate superseded facts
        if (conflictResult.length > 0) {
          await db.memoryFact.updateMany({
            where: { id: { in: conflictResult } },
            data: { active: false, validUntil: new Date() },
          });
        }
      }

      // Store the new fact
      await db.memoryFact.create({
        data: {
          userId,
          category: fact.category,
          subject: fact.subject,
          predicate: fact.predicate,
          content: fact.content,
          sourceId: sessionId,
        },
      });
    }
  } catch (err) {
    console.error("Fact extraction failed:", err);
  }
}

// ─── Conflict detection ─────────────────────────

async function detectConflicts(
  newFact: ExtractedFact,
  existingFacts: Array<{ id: string; category: string; subject: string; predicate: string; content: string }>,
): Promise<string[]> {
  if (existingFacts.length === 0) return [];

  try {
    const existingList = existingFacts
      .map((f) => `[${f.id}] ${f.subject} / ${f.predicate}: ${f.content}`)
      .join("\n");

    const aiResult = await generateCoaching({
      systemPrompt: CONFLICT_PROMPT,
      userMessage: `NEW FACT: ${newFact.subject} / ${newFact.predicate}: ${newFact.content}\n\nEXISTING FACTS:\n${existingList}`,
      maxTokens: 200,
      temperature: 0.1,
    });

    const result = JSON.parse(aiResult.text.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
    const supersedes = result.supersedes;

    if (!Array.isArray(supersedes)) return [];

    // Only return IDs that actually exist in our list
    const validIds = new Set(existingFacts.map((f) => f.id));
    return supersedes.filter((id: string) => validIds.has(id));
  } catch {
    // If conflict detection fails, don't supersede anything — safer to keep old facts
    return [];
  }
}

// ─── Get active facts for memory injection ──────

/**
 * Get the most relevant active facts for a user, capped at maxFacts.
 * Returns newest facts first (most likely to be referenced).
 */
export async function getActiveFacts(
  userId: string,
  maxFacts: number = 100,
): Promise<Array<{ category: string; subject: string; content: string; confidence: number }>> {
  const facts = await db.memoryFact.findMany({
    where: { userId, active: true },
    orderBy: { learnedAt: "desc" },
    take: maxFacts,
    select: { category: true, subject: true, content: true, confidence: true },
  });

  return facts;
}
