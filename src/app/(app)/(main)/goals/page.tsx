import { getGoals } from "@/lib/actions/goals";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalForm } from "@/components/goals/goal-form";
import { Button } from "@/components/ui/button";
import { Plus, Target } from "lucide-react";

export default async function GoalsPage() {
  const goals = await getGoals();
  const activeGoals = goals.filter((g) => g.status === "active");
  const otherGoals = goals.filter((g) => g.status !== "active");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Confidence Goals</h1>
          <p className="mt-2 text-muted-foreground">
            Direct your confidence toward specific outcomes that matter.
          </p>
        </div>
        <GoalForm
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          }
        />
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">No goals yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Confidence without direction is just energy. Set specific goals —
            cash flow targets, career milestones, personal achievements — and
            your daily coaching work will compound toward what matters.
          </p>
          <GoalForm
            trigger={
              <Button className="mt-6">
                <Plus className="h-4 w-4 mr-2" />
                Set Your First Goal
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-8">
          {activeGoals.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Active Goals ({activeGoals.length}/5)
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {activeGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </div>
          )}

          {otherGoals.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Achieved & Paused
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {otherGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
