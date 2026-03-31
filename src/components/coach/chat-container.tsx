"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ChatInput } from "@/components/coach/chat-input";
import { ChatMessage } from "@/components/coach/chat-message";
import { ESCALATION_MESSAGE } from "@/lib/safety/escalation";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface EscalationData {
  heading: string;
  body: string;
  action: string;
  resources: ReadonlyArray<{ name: string; detail: string }>;
}

interface ChatContainerProps {
  initialMessages?: Message[];
  initialSessionId?: string | null;
  modelLabel?: string;
}

export function ChatContainer({
  initialMessages = [],
  initialSessionId = null,
  modelLabel: initialModelLabel = "Haiku",
}: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [escalation, setEscalation] = useState<EscalationData | null>(null);
  const [activeModel, setActiveModel] = useState(initialModelLabel);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(
    async (text: string) => {
      if (isStreaming) return;

      setError(null);
      setEscalation(null);

      // Add user message optimistically
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      // Placeholder for assistant response
      const assistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        const res = await fetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            ...(sessionId ? { sessionId } : {}),
          }),
        });

        // Check for flagged (non-streaming JSON response)
        const contentType = res.headers.get("Content-Type") ?? "";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          // Remove the empty assistant placeholder
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));

          if (data.flagged) {
            setEscalation(data.escalation ?? ESCALATION_MESSAGE);
            if (data.sessionId) setSessionId(data.sessionId);
          } else if (data.error) {
            setError(data.error);
          }
          setIsStreaming(false);
          return;
        }

        // Stream the response
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6);

            try {
              const data = JSON.parse(json);

              if (data.error) {
                setError(data.error);
                setMessages((prev) => prev.filter((m) => m.id !== assistantId));
                break;
              }

              if (data.done) {
                setSessionId(data.sessionId);
                if (data.model) setActiveModel(data.model);
                break;
              }

              if (data.text) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + data.text }
                      : m,
                  ),
                );
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong",
        );
        // Remove empty assistant placeholder on error
        setMessages((prev) =>
          prev.filter(
            (m) => !(m.id === assistantId && m.content === ""),
          ),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, sessionId],
  );

  return (
    <div className="flex h-[calc(100vh-220px)] flex-col">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto pb-4"
      >
        {messages.length === 0 && !escalation && (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-muted-foreground">
              What&apos;s on your mind? Your coach is here.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            isStreaming={
              isStreaming &&
              msg.role === "assistant" &&
              msg.id === messages[messages.length - 1]?.id
            }
          />
        ))}

        {/* Escalation banner */}
        {escalation && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <h3 className="font-semibold text-destructive">
              {escalation.heading}
            </h3>
            <p className="mt-1 text-sm">{escalation.body}</p>
            <p className="mt-2 text-sm font-medium">{escalation.action}</p>
            <ul className="mt-2 space-y-1 text-sm">
              {escalation.resources.map((r) => (
                <li key={r.name}>
                  <strong>{r.name}</strong> — {r.detail}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex items-center justify-between pt-1 pb-1">
        <span className="text-xs text-muted-foreground">
          Model: <span className="font-medium">{activeModel}</span>
        </span>
      </div>
      <ChatInput onSend={handleSend} disabled={isStreaming || !!escalation} />
    </div>
  );
}
