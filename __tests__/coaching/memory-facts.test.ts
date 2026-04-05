import { describe, it, expect, vi } from "vitest";

// Mock the db and AI modules before importing
vi.mock("@/lib/utils/db", () => ({
  db: {
    memoryFact: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({}),
    },
    chatMessage: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock("@/lib/ai/client", () => ({
  generateCoaching: vi.fn().mockResolvedValue("{}"),
}));

import { db } from "@/lib/utils/db";
import { generateCoaching } from "@/lib/ai/client";
import { extractSessionFacts, getActiveFacts } from "@/lib/coaching/memory-facts";

describe("memory-facts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extractSessionFacts", () => {
    it("skips sessions with fewer than 4 messages", async () => {
      vi.mocked(db.chatMessage.findMany).mockResolvedValue([
        { role: "user", content: "Hello", id: "1", sessionId: "s1", flagged: false, flaggedReason: null, createdAt: new Date() },
        { role: "assistant", content: "Hi", id: "2", sessionId: "s1", flagged: false, flaggedReason: null, createdAt: new Date() },
      ]);

      await extractSessionFacts("session-1", "user-1");

      expect(generateCoaching).not.toHaveBeenCalled();
    });

    it("extracts facts from user messages only", async () => {
      vi.mocked(db.chatMessage.findMany).mockResolvedValue([
        { role: "user", content: "My father Roberto was a marine", id: "1", sessionId: "s1", flagged: false, flaggedReason: null, createdAt: new Date() },
        { role: "assistant", content: "Tell me more about Roberto", id: "2", sessionId: "s1", flagged: false, flaggedReason: null, createdAt: new Date() },
        { role: "user", content: "He taught me to never quit", id: "3", sessionId: "s1", flagged: false, flaggedReason: null, createdAt: new Date() },
        { role: "assistant", content: "That sounds like a strong value", id: "4", sessionId: "s1", flagged: false, flaggedReason: null, createdAt: new Date() },
        { role: "user", content: "It shaped who I am today", id: "5", sessionId: "s1", flagged: false, flaggedReason: null, createdAt: new Date() },
      ]);

      vi.mocked(generateCoaching).mockResolvedValue(JSON.stringify({
        facts: [
          {
            category: "person",
            subject: "user.father",
            predicate: "named",
            content: "User's father is named Roberto",
          },
          {
            category: "context",
            subject: "user.father",
            predicate: "occupation",
            content: "User's father was a marine",
          },
          {
            category: "story",
            subject: "user",
            predicate: "values_from_father",
            content: "User's father taught them to never quit, shaping who they are",
          },
        ],
      }));

      vi.mocked(db.memoryFact.findMany).mockResolvedValue([]);

      await extractSessionFacts("session-1", "user-1");

      // Should have called AI with only user messages
      expect(generateCoaching).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(generateCoaching).mock.calls[0][0];
      expect(callArgs.userMessage).toContain("My father Roberto was a marine");
      expect(callArgs.userMessage).toContain("He taught me to never quit");
      expect(callArgs.userMessage).not.toContain("Tell me more about Roberto");

      // Should have created 3 facts
      expect(db.memoryFact.create).toHaveBeenCalledTimes(3);

      // Verify first fact content
      const firstCreate = vi.mocked(db.memoryFact.create).mock.calls[0][0];
      expect(firstCreate.data.subject).toBe("user.father");
      expect(firstCreate.data.content).toContain("Roberto");
      expect(firstCreate.data.userId).toBe("user-1");
      expect(firstCreate.data.sourceId).toBe("session-1");
    });

    it("skips duplicate facts", async () => {
      vi.mocked(db.chatMessage.findMany).mockResolvedValue([
        { role: "user", content: "My father Roberto was a marine", id: "1", sessionId: "s1", flagged: false, flaggedReason: null, createdAt: new Date() },
        { role: "assistant", content: "Noted", id: "2", sessionId: "s1", flagged: false, flaggedReason: null, createdAt: new Date() },
        { role: "user", content: "He was tough but fair", id: "3", sessionId: "s1", flagged: false, flaggedReason: null, createdAt: new Date() },
        { role: "assistant", content: "Interesting", id: "4", sessionId: "s1", flagged: false, flaggedReason: null, createdAt: new Date() },
      ]);

      vi.mocked(generateCoaching).mockResolvedValue(JSON.stringify({
        facts: [
          {
            category: "person",
            subject: "user.father",
            predicate: "named",
            content: "User's father is named Roberto",
          },
        ],
      }));

      // Existing fact with same subject+predicate+content
      vi.mocked(db.memoryFact.findMany).mockResolvedValue([
        {
          id: "existing-1",
          category: "person",
          subject: "user.father",
          predicate: "named",
          content: "User's father is named Roberto",
          userId: "user-1",
          confidence: 1.0,
          active: true,
          sourceId: "old-session",
          learnedAt: new Date(),
          validUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await extractSessionFacts("session-1", "user-1");

      // Should NOT create a duplicate
      expect(db.memoryFact.create).not.toHaveBeenCalled();
    });

    it("handles malformed AI response gracefully", async () => {
      vi.mocked(db.chatMessage.findMany).mockResolvedValue([
        { role: "user", content: "Something meaningful here about my life", id: "1", sessionId: "s1", flagged: false, flaggedReason: null, createdAt: new Date() },
        { role: "assistant", content: "Tell me more", id: "2", sessionId: "s1", flagged: false, flaggedReason: null, createdAt: new Date() },
        { role: "user", content: "I have many things to share", id: "3", sessionId: "s1", flagged: false, flaggedReason: null, createdAt: new Date() },
        { role: "assistant", content: "Go on", id: "4", sessionId: "s1", flagged: false, flaggedReason: null, createdAt: new Date() },
      ]);

      vi.mocked(generateCoaching).mockResolvedValue("This is not JSON at all");
      vi.mocked(db.memoryFact.findMany).mockResolvedValue([]);

      // Should not throw
      await expect(extractSessionFacts("session-1", "user-1")).resolves.not.toThrow();
      expect(db.memoryFact.create).not.toHaveBeenCalled();
    });
  });

  describe("getActiveFacts", () => {
    it("returns facts capped at maxFacts", async () => {
      const mockFacts = Array.from({ length: 5 }, (_, i) => ({
        category: "context",
        subject: "user",
        content: `Fact ${i}`,
      }));

      vi.mocked(db.memoryFact.findMany).mockResolvedValue(mockFacts as never);

      const result = await getActiveFacts("user-1", 3);

      expect(db.memoryFact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 3 }),
      );
    });
  });
});
