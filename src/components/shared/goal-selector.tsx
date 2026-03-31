"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { getActiveGoals } from "@/lib/actions/goals";

interface Goal {
  id: string;
  title: string;
  category: string;
  efficacyScore: number;
}

interface GoalSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function GoalSelector({ value, onChange }: GoalSelectorProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveGoals().then((g) => {
      setGoals(g);
      setLoading(false);
    });
  }, []);

  if (loading) return null;
  if (goals.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label htmlFor="goalId">Which goal is this serving? (optional)</Label>
      <select
        id="goalId"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">No specific goal</option>
        {goals.map((goal) => (
          <option key={goal.id} value={goal.id}>
            {goal.title}
          </option>
        ))}
      </select>
    </div>
  );
}
