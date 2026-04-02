"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/coach/chat-input";
import { ChatMessage } from "@/components/coach/chat-message";
import { RotateCcw, Zap } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ResetStream() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [initialDone, setInitialDone] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const triggered = useRef(false);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initial auto-reset on mount
  const runInitialReset = useCallback(async () => {
    if (isStreaming) return;
    setError(null);
    setIsStreaming(true);

    const assistantId = `reset-${Date.now()}`;
    setMessages([{ id: assistantId, role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/instant-reset", { method: "POST" });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Reset failed");
        setMessages([]);
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

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
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) {
              setError(data.error);
              break;
            }
            if (data.done) {
              setInitialDone(true);
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
            // skip
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMessages([]);
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming]);

  useEffect(() => {
    if (!triggered.current) {
      triggered.current = true;
      runInitialReset();
    }
  }, [runInitialReset]);

  // Follow-up messages go through the coach API
  const handleSend = useCallback(
    async (text: string) => {
      if (isStreaming) return;
      setError(null);

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

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

        const contentType = res.headers.get("Content-Type") ?? "";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          if (data.error) setError(data.error);
          setIsStreaming(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream");

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
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                setError(data.error);
                setMessages((prev) =>
                  prev.filter((m) => m.id !== assistantId),
                );
                break;
              }
              if (data.done) {
                if (data.sessionId) setSessionId(data.sessionId);
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
              // skip
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setMessages((prev) =>
          prev.filter((m) => !(m.id === assistantId && m.content === "")),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, sessionId],
  );

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pb-4"
      >
        {messages.length === 0 && !error && isStreaming && (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Zap className="h-5 w-5 animate-pulse text-primary" />
              <span>Preparing your reset...</span>
            </div>
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

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* After initial reset: show chat input + reset again button */}
      {initialDone && (
        <div className="space-y-2 pt-2">
          <ChatInput onSend={handleSend} disabled={isStreaming} />
          <div className="flex justify-center">
            <Button
              onClick={() => {
                triggered.current = false;
                setMessages([]);
                setInitialDone(false);
                setSessionId(null);
                runInitialReset();
              }}
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              New Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
