"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Heart, ShieldCheck, ArrowRight } from "lucide-react";
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
import { ConfidenceScore } from "@/components/shared/confidence-score";
import { EscalationBanner } from "@/components/shared/escalation-banner";
import { submitReset, type ResetResult } from "@/lib/actions/reset";
import { resetInputSchema, type ResetInput } from "@/lib/validators/reset";

export function ResetForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ResetResult | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ResetInput>({
    resolver: zodResolver(resetInputSchema),
    defaultValues: {
      eventDescription: "",
      emotionalState: "",
      confidenceScore: 5,
    },
  });

  function onSubmit(data: ResetInput) {
    setResult(null);
    startTransition(async () => {
      const res = await submitReset(data);
      setResult(res);
      if (res.success) reset();
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Input form ────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Reset Check-In</CardTitle>
          <CardDescription>
            Name what happened, how you feel, and let your coach help you
            recalibrate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset disabled={isPending}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="eventDescription">What Happened</Label>
              <Textarea
                id="eventDescription"
                placeholder="Describe the setback or difficult moment..."
                rows={3}
                {...register("eventDescription")}
              />
              {errors.eventDescription && (
                <p className="text-sm text-destructive">
                  {errors.eventDescription.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emotionalState">How I Feel Right Now</Label>
              <Textarea
                id="emotionalState"
                placeholder="Frustrated, disappointed, anxious..."
                rows={2}
                {...register("emotionalState")}
              />
              {errors.emotionalState && (
                <p className="text-sm text-destructive">
                  {errors.emotionalState.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Current Confidence Level</Label>
              <Controller
                name="confidenceScore"
                control={control}
                render={({ field }) => (
                  <ConfidenceScore
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.confidenceScore && (
                <p className="text-sm text-destructive">
                  {errors.confidenceScore.message}
                </p>
              )}
            </div>

            {result && !result.success && !("flagged" in result && result.flagged) && (
              <p className="text-sm text-destructive">
                {"error" in result ? result.error : "Something went wrong"}
              </p>
            )}

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Resetting..." : "Run Reset"}
            </Button>
          </form>
          </fieldset>
        </CardContent>
      </Card>

      {/* ── Flagged / escalation ──────────────── */}
      {result && !result.success && "flagged" in result && result.flagged && (
        <EscalationBanner escalation={result.escalation} />
      )}

      {/* ── Coaching result ───────────────────── */}
      {result && result.success && (
        <div className="space-y-4">
          {/* Acknowledgement */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Heart className="h-5 w-5 text-rose-500" />
              <CardTitle className="text-base">Acknowledgement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                {result.data.acknowledgement}
              </p>
            </CardContent>
          </Card>

          {/* Safeguard */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Safeguard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                {result.data.safeguard}
              </p>
            </CardContent>
          </Card>

          {/* Next Action Cue */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <ArrowRight className="h-5 w-5 text-green-600" />
              <CardTitle className="text-base">Next Action Cue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium leading-relaxed">
                {result.data.nextActionCue}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
