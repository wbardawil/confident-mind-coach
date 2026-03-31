"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfidenceScore } from "@/components/shared/confidence-score";
import { GoalForm } from "@/components/goals/goal-form";
import {
  updateEfficacyScore,
  updateGoalStatus,
  deleteGoal,
} from "@/lib/actions/goals";
import { GOAL_CATEGORY_LABELS, type GoalCategory } from "@/lib/validators/goals";
import {
  Target,
  Trophy,
  Pause,
  Play,
  Pencil,
  Trash2,
} from "lucide-react";

interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    targetDate: Date | null;
    efficacyScore: number;
    status: string;
    evidenceCount: number;
    createdAt: Date;
  };
}

export function GoalCard({ goal }: GoalCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localScore, setLocalScore] = useState(goal.efficacyScore);

  function handleScoreChange(score: number) {
    setLocalScore(score);
    startTransition(async () => {
      await updateEfficacyScore(goal.id, score);
      router.refresh();
    });
  }

  function handleStatusChange(status: "active" | "achieved" | "paused") {
    startTransition(async () => {
      await updateGoalStatus(goal.id, status);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteGoal(goal.id);
      router.refresh();
    });
  }

  const isActive = goal.status === "active";
  const isAchieved = goal.status === "achieved";

  return (
    <Card className={!isActive ? "opacity-70" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {isAchieved ? (
              <Trophy className="h-5 w-5 text-yellow-500 shrink-0" />
            ) : (
              <Target className="h-5 w-5 text-primary shrink-0" />
            )}
            <CardTitle className="text-base leading-tight">
              {goal.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Badge
              variant={isAchieved ? "default" : isActive ? "secondary" : "outline"}
              className="text-xs"
            >
              {GOAL_CATEGORY_LABELS[goal.category as GoalCategory] ?? goal.category}
            </Badge>
            {isAchieved && (
              <Badge className="text-xs bg-yellow-500">Achieved</Badge>
            )}
            {goal.status === "paused" && (
              <Badge variant="outline" className="text-xs">Paused</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {goal.description && (
          <p className="text-sm text-muted-foreground">{goal.description}</p>
        )}

        {/* Efficacy score */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Self-efficacy: How confident am I that I can achieve this?
          </p>
          <ConfidenceScore
            value={localScore}
            onChange={isActive ? handleScoreChange : () => {}}
          />
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {goal.targetDate && (
            <span>
              Target: {goal.targetDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
          <span>{goal.evidenceCount} evidence deposits</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {isActive && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("achieved")}
                disabled={isPending}
                className="text-xs"
              >
                <Trophy className="h-3 w-3 mr-1" />
                Mark Achieved
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusChange("paused")}
                disabled={isPending}
                className="text-xs"
              >
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </Button>
            </>
          )}
          {goal.status === "paused" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange("active")}
              disabled={isPending}
              className="text-xs"
            >
              <Play className="h-3 w-3 mr-1" />
              Resume
            </Button>
          )}
          <GoalForm
            trigger={
              <Button variant="ghost" size="sm" className="text-xs">
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
            }
            defaultValues={{
              id: goal.id,
              title: goal.title,
              description: goal.description ?? "",
              category: goal.category as GoalCategory,
              targetDate: goal.targetDate
                ? goal.targetDate.toISOString().slice(0, 10)
                : "",
              efficacyScore: goal.efficacyScore,
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs text-muted-foreground hover:text-destructive ml-auto"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
