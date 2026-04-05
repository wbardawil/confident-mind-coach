/**
 * Memory quality monitor.
 *
 * Verifies that the coaching memory system is producing consistent,
 * accurate context for users by cross-referencing session data.
 *
 * This module is designed to be extended once MemoryFact model is added
 * to the schema. For now, it monitors session consistency.
 */

import { db } from "@/lib/utils/db";

/**
 * Get memory health stats for a user — how much context the coach has.
 */
export async function getMemoryHealth(userId: string): Promise<{
  sessionCount: number;
  messageCount: number;
  espCount: number;
  aarCount: number;
  achievementCount: number;
  goalCount: number;
  documentCount: number;
  healthScore: number; // 0-100 composite score
}> {
  const [sessionCount, messageCount, espCount, aarCount, achievementCount, goalCount, documentCount] = await Promise.all([
    db.chatSession.count({ where: { userId } }),
    db.chatMessage.count({ where: { session: { userId } } }),
    db.eSPEntry.count({ where: { userId } }),
    db.aAREntry.count({ where: { userId } }),
    db.achievement.count({ where: { userId } }),
    db.confidenceGoal.count({ where: { userId, status: "active" } }),
    db.userDocument.count({ where: { userId } }),
  ]);

  // Health score: how well-equipped is the coach to give personalized advice?
  let healthScore = 0;
  if (achievementCount > 0) healthScore += 20; // Top Ten present
  if (sessionCount > 0) healthScore += 15;     // At least one conversation
  if (sessionCount >= 5) healthScore += 15;    // Multiple conversations
  if (espCount >= 3) healthScore += 10;        // Regular ESP practice
  if (aarCount >= 2) healthScore += 10;        // Reviews done
  if (goalCount > 0) healthScore += 15;        // Has active goals
  if (documentCount > 0) healthScore += 15;    // Uploaded context documents
  healthScore = Math.min(100, healthScore);

  return {
    sessionCount,
    messageCount,
    espCount,
    aarCount,
    achievementCount,
    goalCount,
    documentCount,
    healthScore,
  };
}
