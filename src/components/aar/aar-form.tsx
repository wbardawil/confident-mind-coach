"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Lightbulb } from "lucide-react";
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
import { EscalationBanner } from "@/components/shared/escalation-banner";
import { submitAar, type AarResult } from "@/lib/actions/aar";
import { aarInputSchema, type AarInput } from "@/lib/validators/aar";

export function AarForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AarResult | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AarInput>({
    resolver: zodResolver(aarInputSchema),
    defaultValues: {
      whatHappened: "",
      soWhat: "",
      nowWhat: "",
    },
  });

  function onSubmit(data: AarInput) {
    setResult(null);
    startTransition(async () => {
      const res = await submitAar(data);
      setResult(res);
      if (res.success) reset();
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Input form ────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>After Action Review</CardTitle>
          <CardDescription>
            Reflect on what happened, why it matters, and what comes next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset disabled={isPending}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="whatHappened">What Happened</Label>
              <Textarea
                id="whatHappened"
                placeholder="Describe the event or performance objectively..."
                rows={3}
                {...register("whatHappened")}
              />
              {errors.whatHappened && (
                <p className="text-sm text-destructive">
                  {errors.whatHappened.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="soWhat">So What</Label>
              <Textarea
                id="soWhat"
                placeholder="Why does this matter? What did you learn?"
                rows={3}
                {...register("soWhat")}
              />
              {errors.soWhat && (
                <p className="text-sm text-destructive">
                  {errors.soWhat.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nowWhat">Now What</Label>
              <Textarea
                id="nowWhat"
                placeholder="What will you do differently next time?"
                rows={3}
                {...register("nowWhat")}
              />
              {errors.nowWhat && (
                <p className="text-sm text-destructive">
                  {errors.nowWhat.message}
                </p>
              )}
            </div>

            {result && !result.success && !("flagged" in result && result.flagged) && (
              <p className="text-sm text-destructive">
                {"error" in result ? result.error : "Something went wrong"}
              </p>
            )}

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Reviewing..." : "Submit Review"}
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
          {/* Lessons Learned */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Lessons Learned</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                {result.data.lessonsLearned}
              </p>
            </CardContent>
          </Card>

          {/* Improvement Plan */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">Improvement Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                {result.data.improvementPlan}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
