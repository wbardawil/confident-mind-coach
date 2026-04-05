import { ChatContainer } from "@/components/coach/chat-container";
import { ChatHistory } from "@/components/coach/chat-history";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/utils/user";
import { db } from "@/lib/utils/db";

const MODEL_LABELS: Record<string, string> = {
  "haiku-4.5": "Haiku 4.5",
  "sonnet-3.5": "Sonnet 3.5",
  "sonnet-4": "Sonnet 4",
  "opus-3": "Opus 4",
};

interface CoachPageProps {
  searchParams: { new?: string; session?: string };
}

export default async function CoachPage({ searchParams }: CoachPageProps) {
  const startFresh = searchParams.new === "true";
  const requestedSessionId = searchParams.session;

  let initialMessages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
  }> = [];
  let initialSessionId: string | null = null;
  let coachModel = "haiku-4.5";

  try {
    const user = await getCurrentUser();
    if (user) {
      coachModel = user.profile?.coachModel ?? "haiku-4.5";

      if (!startFresh) {
        // Load a specific session or the most recent one
        const session = requestedSessionId
          ? await db.chatSession.findFirst({
              where: { id: requestedSessionId, userId: user.id },
              include: {
                messages: {
                  orderBy: { createdAt: "asc" },
                  take: 50,
                  select: { id: true, role: true, content: true },
                },
              },
            })
          : await db.chatSession.findFirst({
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

        if (session && session.messages.length > 0) {
          initialSessionId = session.id;
          initialMessages = session.messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
          }));
        }
      }
    }
  } catch {
    // If DB fails, just show empty chat
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Coach</h1>
            <Badge variant="secondary" className="text-xs">
              {MODEL_LABELS[coachModel] ?? coachModel}
            </Badge>
          </div>
          <p className="mt-2 text-muted-foreground">
            Talk through what&apos;s on your mind with your confidence coach.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ChatHistory currentSessionId={initialSessionId} />
          {initialSessionId && (
            <a
              href="/coach?new=true"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              New Chat
            </a>
          )}
        </div>
      </div>
      <ChatContainer
        initialMessages={initialMessages}
        initialSessionId={initialSessionId}
        modelLabel={MODEL_LABELS[coachModel] ?? coachModel}
      />
    </div>
  );
}
