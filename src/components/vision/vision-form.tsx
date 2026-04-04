"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  visionSchema,
  VISION_DOMAINS,
  VISION_DOMAIN_LABELS,
  type VisionInput,
  type VisionDomainType,
} from "@/lib/validators/vision";
import { createVision, updateVision } from "@/lib/actions/vision";

interface VisionFormProps {
  trigger: React.ReactNode;
  /** Domains the user already has a vision for — hide them from the dropdown */
  takenDomains?: string[];
  /** For editing an existing vision */
  defaultValues?: { id?: string; domain?: string; vision?: string; currentState?: string };
}

export function VisionForm({
  trigger: triggerButton,
  takenDomains = [],
  defaultValues,
}: VisionFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!defaultValues?.id;

  const availableDomains = VISION_DOMAINS.filter(
    (d) => !takenDomains.includes(d) || d === defaultValues?.domain,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors },
  } = useForm<VisionInput>({
    resolver: zodResolver(visionSchema),
    defaultValues: {
      domain: (defaultValues?.domain as VisionDomainType) ?? availableDomains[0] ?? "career",
      vision: defaultValues?.vision ?? "",
      currentState: defaultValues?.currentState ?? "",
    },
  });

  function onSubmit(data: VisionInput) {
    setError(null);
    startTransition(async () => {
      const result = isEditing
        ? await updateVision(defaultValues!.id!, { vision: data.vision, currentState: data.currentState })
        : await createVision(data);

      if (!result.success) {
        setError(result.error);
        return;
      }
      setOpen(false);
      reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Vision" : "Define Your 10x Vision"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Domain selector — only for create */}
          {!isEditing && (
            <div className="space-y-2">
              <Label>Life Domain</Label>
              <select
                {...register("domain")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {availableDomains.map((d) => (
                  <option key={d} value={d}>
                    {VISION_DOMAIN_LABELS[d]}
                  </option>
                ))}
              </select>
              {formErrors.domain?.message && (
                <p className="text-sm text-destructive">
                  {formErrors.domain.message}
                </p>
              )}
            </div>
          )}

          {/* Vision */}
          <div className="space-y-2">
            <Label>
              {isEditing
                ? "Your 10x Vision"
                : "If this area of your life was 10x what it is today, what would it look like?"}
            </Label>
            <Textarea
              {...register("vision")}
              rows={4}
              placeholder="Be vivid and specific. What does 10x look like? What are you doing, earning, creating, experiencing?"
            />
            {formErrors.vision?.message && (
              <p className="text-sm text-destructive">
                {formErrors.vision.message}
              </p>
            )}
          </div>

          {/* Current state */}
          <div className="space-y-2">
            <Label>Where are you now? (optional)</Label>
            <Textarea
              {...register("currentState")}
              rows={3}
              placeholder="Be honest about your starting point. This helps your coach understand the gap."
            />
            {formErrors.currentState?.message && (
              <p className="text-sm text-destructive">
                {formErrors.currentState.message}
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save"
                  : "Create Vision"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
