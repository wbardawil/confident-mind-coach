"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Zap } from "lucide-react";
import Link from "next/link";

export function ResetStream() {
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const triggered = useRef(false);

  const runReset = useCallback(async () => {
    if (isStreaming) return;
    setContent("");
    setError(null);
    setIsDone(false);
    setIsStreaming(true);

    try {
      const res = await fetch("/api/instant-reset", { method: "POST" });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Reset failed");
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
              setIsDone(true);
              break;
            }
            if (data.text) {
              setContent((prev) => prev + data.text);
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming]);

  // Auto-trigger on mount — the whole point is zero interaction
  useEffect(() => {
    if (!triggered.current) {
      triggered.current = true;
      runReset();
    }
  }, [runReset]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content]);

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Streaming content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-lg border bg-card p-6"
      >
        {!content && !error && isStreaming && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Zap className="h-5 w-5 animate-pulse text-primary" />
            <span>Preparing your reset...</span>
          </div>
        )}

        {content && (
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
            {content}
            {isStreaming && (
              <span className="inline-block h-4 w-1.5 animate-pulse bg-primary ml-0.5" />
            )}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Actions */}
      {isDone && (
        <div className="flex gap-3 pt-4">
          <Button onClick={runReset} variant="outline" className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Again
          </Button>
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full">
              I'm Good — Back to Dashboard
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
