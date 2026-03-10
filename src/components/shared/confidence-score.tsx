"use client";

import { cn } from "@/lib/utils";

interface ConfidenceScoreProps {
  value: number;
  onChange: (value: number) => void;
}

export function ConfidenceScore({ value, onChange }: ConfidenceScoreProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors",
              score === value
                ? "bg-primary text-primary-foreground"
                : "border bg-background hover:bg-accent"
            )}
          >
            {score}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Low confidence</span>
        <span>High confidence</span>
      </div>
    </div>
  );
}
