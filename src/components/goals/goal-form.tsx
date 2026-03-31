"use client";

import { useTransition, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfidenceScore } from "@/components/shared/confidence-score";
import {
  goalSchema,
  GOAL_CATEGORIES,
  GOAL_CATEGORY_LABELS,
  type GoalInput,
} from "@/lib/validators/goals";
import { createGoal, updateGoal } from "@/lib/actions/goals";

interface GoalFormProps {
  trigger: React.ReactNode;
  defaultValues?: GoalInput & { id?: string };
}

export function GoalForm({ trigger: triggerButton, defaultValues }: GoalFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!defaultValues?.id;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: defaultValues ?? {
      title: "",
      description: "",
      category: "career",
      targetDate: "",
      efficacyScore: 5,
    },
  });

  function onSubmit(data: GoalInput) {
    setError(null);
    startTransition(async () => {
      const result = isEditing
        ? await updateGoal(defaultValues!.id!, data)
        : await createGoal(data);

      if (result.success) {
        setOpen(false);
        if (!isEditing) reset();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Goal" : "Add Confidence Goal"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">What do you want to achieve?</Label>
            <Input
              id="title"
              placeholder="e.g. Grow cash flow to $15K/month"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Why does this matter? (optional)</Label>
            <Textarea
              id="description"
              placeholder="What would achieving this mean for you?"
              rows={2}
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                {...register("category")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {GOAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {GOAL_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date (optional)</Label>
              <Input
                id="targetDate"
                type="date"
                {...register("targetDate")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>How confident are you that you can achieve this?</Label>
            <Controller
              name="efficacyScore"
              control={control}
              render={({ field }) => (
                <ConfidenceScore
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.efficacyScore && (
              <p className="text-sm text-destructive">
                {errors.efficacyScore.message}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Update" : "Add Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
