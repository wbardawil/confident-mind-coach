"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, Eye, Award, Crosshair } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { submitPregame, type PregameResult } from "@/lib/actions/pregame";
import { pregameInputSchema, type PregameInput } from "@/lib/validators/pregame";

export function PregameForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<PregameResult | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<PregameInput>({
    resolver: zodResolver(pregameInputSchema),
    defaultValues: {
      upcomingEvent: "",
      confidenceLevel: 5,
      fear: "",
      definitionOfSuccess: "",
    },
  });

  function onSubmit(data: PregameInput) {
    setResult(null);
    startTransition(async () => {
      const res = await submitPregame(data);
      setResult(res);
      if (res.success) reset();
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Input form ────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Pregame Preparation</CardTitle>
          <CardDescription>
            Ground yourself before the moment arrives. Name the event, your
            fear, and what success looks like.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="upcomingEvent">Upcoming Event</Label>
              <Input
                id="upcomingEvent"
                placeholder="e.g. Quarterly board presentation"
                {...register("upcomingEvent")}
              />
              {errors.upcomingEvent && (
                <p className="text-sm text-destructive">
                  {errors.upcomingEvent.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Current Confidence Level</Label>
              <Controller
                name="confidenceLevel"
                control={control}
                render={({ field }) => (
                  <ConfidenceScore
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.confidenceLevel && (
                <p className="text-sm text-destructive">
                  {errors.confidenceLevel.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fear">My Biggest Fear</Label>
              <Textarea
                id="fear"
                placeholder="What are you most worried about?"
                rows={3}
                {...register("fear")}
              />
              {errors.fear && (
                <p className="text-sm text-destructive">
                  {errors.fear.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="definitionOfSuccess">Definition of Success</Label>
              <Textarea
                id="definitionOfSuccess"
                placeholder="What does a successful outcome look like?"
                rows={3}
                {...register("definitionOfSuccess")}
              />
              {errors.definitionOfSuccess && (
                <p className="text-sm text-destructive">
                  {errors.definitionOfSuccess.message}
                </p>
              )}
            </div>

            {result && !result.success && !("flagged" in result && result.flagged) && (
              <p className="text-sm text-destructive">
                {"error" in result ? result.error : "Something went wrong"}
              </p>
            )}

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Preparing..." : "Run Pregame"}
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
          {/* Take Stock */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Award className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Take Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                {result.data.takeStock}
              </p>
            </CardContent>
          </Card>

          {/* Situation Assessment */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Crosshair className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base">Situation Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                {result.data.situationAssessment}
              </p>
            </CardContent>
          </Card>

          {/* Enough Statement */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Enough Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium italic leading-relaxed">
                &ldquo;{result.data.enoughStatement}&rdquo;
              </p>
            </CardContent>
          </Card>

          {/* Visualization Prompt */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Eye className="h-5 w-5 text-violet-600" />
              <CardTitle className="text-base">Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                {result.data.visualizationPrompt}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
