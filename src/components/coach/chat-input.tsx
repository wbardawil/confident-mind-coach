"use client";

import { useRef, useCallback } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const value = textareaRef.current?.value.trim();
    if (!value || disabled) return;
    onSend(value);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    }
  }, [onSend, disabled]);

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 192)}px`; // max ~8 rows
  };

  return (
    <div className="flex items-end gap-2 border-t bg-background pt-3">
      <Textarea
        ref={textareaRef}
        placeholder="Talk to your coach..."
        className="min-h-[44px] max-h-48 resize-none overflow-y-auto"
        rows={2}
        disabled={disabled}
        onInput={handleInput}
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={disabled}
        className="shrink-0"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send</span>
      </Button>
    </div>
  );
}
