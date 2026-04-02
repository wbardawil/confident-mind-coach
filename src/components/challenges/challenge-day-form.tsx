"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Sparkles } from "lucide-react";
import { submitChallengeDay } from "@/lib/actions/challenges";
import type { ChallengeDay } from "@/lib/challenges/types";

interface ChallengeDayFormProps {
  challengeSlug: string;
  day: ChallengeDay;
  existingResponse?: string | null;
}

export function ChallengeDayForm({
  challengeSlug,
  day,
  existingResponse,
}: ChallengeDayFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reflection, setReflection] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(
    existingResponse ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reflection.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await submitChallengeDay(
        challengeSlug,
        day.day,
        reflection,
      );
      if (result.success) {
        setAiResponse(result.aiResponse ?? null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const isCompleted = !!aiResponse;

  return (
    <div className="space-y-4">
      {/* Micro-lesson */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <CardTitle className="text-sm">
            Day {day.day}: {day.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{day.lesson}</p>
        </CardContent>
      </Card>

      {/* Reflection form or completed state */}
      {!isCompleted ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Reflection</CardTitle>
            <CardDescription>{day.prompt}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reflection">Your response</Label>
                <Textarea
                  id="reflection"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Take your time. Write honestly..."
                  rows={5}
                  disabled={isPending}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button
                type="submit"
                disabled={isPending || !reflection.trim()}
                className="w-full"
              >
                {isPending ? "Processing..." : "Submit Day " + day.day}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Coach Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {aiResponse}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
