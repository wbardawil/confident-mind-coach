"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, BookOpen, TrendingUp } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { EscalationBanner } from "@/components/shared/escalation-banner";
import { submitEsp, type EspResult } from "@/lib/actions/esp";
import { espInputSchema, type EspInput } from "@/lib/validators/esp";

export function EspForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<EspResult | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EspInput>({
    resolver: zodResolver(espInputSchema),
    defaultValues: { effort: "", success: "", progress: "" },
  });

  function onSubmit(data: EspInput) {
    setResult(null);
    startTransition(async () => {
      const res = await submitEsp(data);
      setResult(res);
      if (res.success) reset();
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Input form ────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Reflection</CardTitle>
          <CardDescription>
            Capture the effort you invested, what succeeded, and the progress
            you made.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="effort">Effort</Label>
              <Textarea
                id="effort"
                placeholder="What effort did you put in today?"
                rows={3}
                {...register("effort")}
              />
              {errors.effort && (
                <p className="text-sm text-destructive">
                  {errors.effort.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="success">Success</Label>
              <Textarea
                id="success"
                placeholder="What went well today?"
                rows={3}
                {...register("success")}
              />
              {errors.success && (
                <p className="text-sm text-destructive">
                  {errors.success.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress">Progress</Label>
              <Textarea
                id="progress"
                placeholder="What progress did you make?"
                rows={3}
                {...register("progress")}
              />
              {errors.progress && (
                <p className="text-sm text-destructive">
                  {errors.progress.message}
                </p>
              )}
            </div>

            {result && !result.success && !("flagged" in result && result.flagged) && (
              <p className="text-sm text-destructive">
                {"error" in result ? result.error : "Something went wrong"}
              </p>
            )}

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Reflecting..." : "Submit Reflection"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Flagged / escalation ──────────────── */}
      {result && !result.success && "flagged" in result && result.flagged && (
        <EscalationBanner escalation={result.escalation} />
      )}

      {/* ── Coaching result ───────────────────── */}
      {result && result.success && (
        <div className="space-y-4">
          {/* Reflection */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Coaching Reflection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{result.data.reflection}</p>
            </CardContent>
          </Card>

          {/* Affirmation */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Your Affirmation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium italic leading-relaxed">
                &ldquo;{result.data.affirmation}&rdquo;
              </p>
            </CardContent>
          </Card>

          {/* Ledger impact */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <CardTitle className="text-base">Confidence Deposit</CardTitle>
              <Badge variant="secondary" className="ml-auto">
                +{result.data.ledgerImpact.scoreDelta}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">
                {result.data.ledgerImpact.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.data.ledgerImpact.description}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
