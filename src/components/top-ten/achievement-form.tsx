"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
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
import {
  achievementSchema,
  type AchievementInput,
} from "@/lib/validators/top-ten";
import {
  createAchievement,
  updateAchievement,
} from "@/lib/actions/top-ten";

interface AchievementFormProps {
  trigger: React.ReactNode;
  defaultValues?: AchievementInput & { id?: string };
  currentCount: number;
}

export function AchievementForm({
  trigger: triggerButton,
  defaultValues,
  currentCount,
}: AchievementFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!defaultValues?.id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AchievementInput>({
    resolver: zodResolver(achievementSchema),
    defaultValues: defaultValues ?? {
      title: "",
      description: "",
      evidence: "",
      occurredAt: "",
      rank: undefined,
    },
  });

  function onSubmit(data: AchievementInput) {
    setError(null);
    startTransition(async () => {
      const result = isEditing
        ? await updateAchievement(defaultValues!.id!, data)
        : await createAchievement(data);

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
            {isEditing ? "Edit Achievement" : "Add Achievement"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What did you accomplish?"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the accomplishment..."
              rows={3}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidence">Evidence</Label>
            <Textarea
              id="evidence"
              placeholder="What concrete proof supports this?"
              rows={2}
              {...register("evidence")}
            />
            {errors.evidence && (
              <p className="text-sm text-destructive">
                {errors.evidence.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="occurredAt">When (optional)</Label>
              <Input
                id="occurredAt"
                type="date"
                {...register("occurredAt")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rank">Rank 1-10 (optional)</Label>
              <Input
                id="rank"
                type="number"
                min={1}
                max={10}
                {...register("rank", { valueAsNumber: true })}
              />
              {errors.rank && (
                <p className="text-sm text-destructive">
                  {errors.rank.message}
                </p>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {!isEditing && currentCount >= 10 && (
            <p className="text-sm text-muted-foreground">
              You already have 10 achievements. Remove one first.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || (!isEditing && currentCount >= 10)}
            >
              {isPending ? "Saving..." : isEditing ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
