"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfidenceScore } from "@/components/shared/confidence-score";
import { updateEfficacyScore } from "@/lib/actions/goals";
import { CheckCircle } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  category: string;
  efficacyScore: number;
}

interface EfficacyCheckinProps {
  goals: Goal[];
}

export function EfficacyCheckin({ goals }: EfficacyCheckinProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(goals.map((g) => [g.id, g.efficacyScore]))
  );
  const [submitted, setSubmitted] = useState(false);

  function handleScoreChange(goalId: string, score: number) {
    setScores((prev) => ({ ...prev, [goalId]: score }));
  }

  function handleSubmit() {
    startTransition(async () => {
      await Promise.all(
        goals.map((g) => updateEfficacyScore(g.id, scores[g.id]))
      );
      setSubmitted(true);
      router.refresh();
    });
  }

  if (submitted) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="flex flex-col items-center py-8">
          <CheckCircle className="h-10 w-10 text-green-500 mb-3" />
          <p className="text-lg font-semibold">Check-in complete</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your efficacy scores have been updated.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Efficacy Check-in</CardTitle>
        <CardDescription>
          Rate your confidence toward each goal right now. Be honest — tracking
          the trend matters more than the number.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals.map((goal) => (
          <div key={goal.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{goal.title}</p>
              <span className="text-xs text-muted-foreground">
                was {goal.efficacyScore}/10
              </span>
            </div>
            <ConfidenceScore
              value={scores[goal.id]}
              onChange={(v) => handleScoreChange(goal.id, v)}
            />
          </div>
        ))}

        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? "Saving..." : "Save Check-in"}
        </Button>
      </CardContent>
    </Card>
  );
}
