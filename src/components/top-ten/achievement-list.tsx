"use client";

import { Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AchievementCard } from "./achievement-card";
import { AchievementForm } from "./achievement-form";

interface Achievement {
  id: string;
  title: string;
  description: string;
  evidence: string;
  occurredAt: Date | null;
  rank: number | null;
}

interface AchievementListProps {
  achievements: Achievement[];
}

export function AchievementList({ achievements }: AchievementListProps) {
  const count = achievements.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {count} of 10 achievements
          </p>
        </div>
        <AchievementForm
          trigger={
            <Button size="sm" disabled={count >= 10}>
              <Plus className="mr-2 h-4 w-4" />
              Add Achievement
            </Button>
          }
          currentCount={count}
        />
      </div>

      {/* List */}
      {count === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Trophy className="mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-medium">No achievements yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Add your most meaningful accomplishments to build a durable
            confidence memory.
          </p>
          <AchievementForm
            trigger={
              <Button className="mt-4" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add your first achievement
              </Button>
            }
            currentCount={0}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {achievements.map((a) => (
            <AchievementCard
              key={a.id}
              achievement={a}
              currentCount={count}
            />
          ))}
        </div>
      )}
    </div>
  );
}
