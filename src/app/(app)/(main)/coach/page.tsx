import { ChatContainer } from "@/components/coach/chat-container";
import { getCurrentUser } from "@/lib/utils/user";
import { db } from "@/lib/utils/db";

interface CoachPageProps {
  searchParams: { new?: string };
}

export default async function CoachPage({ searchParams }: CoachPageProps) {
  const startFresh = searchParams.new === "true";

  let initialMessages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
  }> = [];
  let initialSessionId: string | null = null;

  try {
    const user = await getCurrentUser();
    if (user && !startFresh) {
      // Load the most recent chat session
      const lastSession = await db.chatSession.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 50,
            select: { id: true, role: true, content: true },
          },
        },
      });

      if (lastSession && lastSession.messages.length > 0) {
        initialSessionId = lastSession.id;
        initialMessages = lastSession.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
      }
    }
  } catch {
    // If DB fails, just show empty chat
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coach</h1>
          <p className="mt-2 text-muted-foreground">
            Talk through what&apos;s on your mind with your confidence coach.
          </p>
        </div>
        {initialSessionId && (
          <a
            href="/coach?new=true"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            New Chat
          </a>
        )}
      </div>
      <ChatContainer
        initialMessages={initialMessages}
        initialSessionId={initialSessionId}
      />
    </div>
  );
}
