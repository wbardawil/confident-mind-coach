"use client";

import { useTransition } from "react";
import { Pencil, Trash2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AchievementForm } from "./achievement-form";
import { deleteAchievement } from "@/lib/actions/top-ten";

interface Achievement {
  id: string;
  title: string;
  description: string;
  evidence: string;
  occurredAt: Date | null;
  rank: number | null;
}

interface AchievementCardProps {
  achievement: Achievement;
  currentCount: number;
}

export function AchievementCard({
  achievement,
  currentCount,
}: AchievementCardProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteAchievement(achievement.id);
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {achievement.rank && (
              <Badge variant="outline" className="text-xs">
                #{achievement.rank}
              </Badge>
            )}
            <CardTitle className="text-base">{achievement.title}</CardTitle>
          </div>
          <div className="flex gap-1">
            <AchievementForm
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="sr-only">Edit</span>
                </Button>
              }
              defaultValues={{
                id: achievement.id,
                title: achievement.title,
                description: achievement.description,
                evidence: achievement.evidence,
                occurredAt: achievement.occurredAt
                  ? achievement.occurredAt.toISOString().split("T")[0]
                  : undefined,
                rank: achievement.rank ?? undefined,
              }}
              currentCount={currentCount}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
        {achievement.occurredAt && (
          <CardDescription>
            {achievement.occurredAt.toLocaleDateString()}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>{achievement.description}</p>
        <div className="flex items-start gap-2 rounded-md bg-muted p-3">
          <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-muted-foreground">{achievement.evidence}</p>
        </div>
      </CardContent>
    </Card>
  );
}
