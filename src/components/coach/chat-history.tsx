"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { History, MessageSquare, Plus } from "lucide-react";
import { getChatSessions, type ChatSessionSummary } from "@/lib/actions/chat";

interface ChatHistoryProps {
  currentSessionId?: string | null;
}

export function ChatHistory({ currentSessionId }: ChatHistoryProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [loading, startTransition] = useTransition();

  // Load sessions when sheet opens
  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      const data = await getChatSessions();
      setSessions(data);
    });
  }, [open]);

  function openSession(sessionId: string) {
    setOpen(false);
    router.push(`/coach?session=${sessionId}`);
  }

  function startNewChat() {
    setOpen(false);
    router.push("/coach?new=true");
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          History
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle>Chat History</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={startNewChat}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>

          <div className="h-px bg-border my-3" />

          {loading && sessions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading...
            </p>
          )}

          {!loading && sessions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No past conversations yet.
            </p>
          )}

          <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
            {sessions.map((s) => {
              const isActive = s.id === currentSessionId;
              const title = s.title || s.preview || "Untitled chat";

              return (
                <button
                  key={s.id}
                  onClick={() => openSession(s.id)}
                  className={`w-full rounded-md px-3 py-2.5 text-left transition-colors ${
                    isActive
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {title.length > 60 ? title.slice(0, 60) + "..." : title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(s.updatedAt)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {s.messageCount} msg{s.messageCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
