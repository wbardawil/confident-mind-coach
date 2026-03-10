"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TagInput } from "@/components/shared/tag-input";
import { ConfidenceScore } from "@/components/shared/confidence-score";
import { saveOnboarding } from "@/lib/actions/onboarding";
import {
  onboardingSchema,
  type OnboardingInput,
} from "@/lib/validators/onboarding";

const STEPS = [
  { title: "About You", description: "Tell us about your role and domain." },
  {
    title: "Strengths",
    description: "What are you already good at?",
  },
  {
    title: "Challenges",
    description: "Where does your confidence struggle?",
  },
  {
    title: "Triggers",
    description: "What situations shake your confidence?",
  },
  {
    title: "Baseline",
    description: "Rate your current overall confidence.",
  },
];

// Fields to validate before allowing Next on each step
const STEP_FIELDS: (keyof OnboardingInput)[][] = [
  ["role", "performanceDomain"],
  ["strengths"],
  ["confidenceChallenges"],
  ["recurringTriggers"],
  ["baselineScore"],
];

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      role: "",
      performanceDomain: "",
      strengths: [],
      confidenceChallenges: [],
      recurringTriggers: [],
      baselineScore: 5,
    },
    mode: "onTouched",
  });

  async function nextStep() {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => s + 1);
  }

  function prevStep() {
    setStep((s) => s - 1);
  }

  function onSubmit(data: OnboardingInput) {
    setError(null);
    startTransition(async () => {
      const result = await saveOnboarding(data);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error);
      }
    });
  }

  const isLast = step === STEPS.length - 1;

  return (
    <Card className="mx-auto w-full max-w-lg">
      {/* Step indicator */}
      <div className="flex gap-1 px-6 pt-6">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <CardHeader>
        <CardTitle>{STEPS[step].title}</CardTitle>
        <CardDescription>{STEPS[step].description}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Step 0: Role + Domain */}
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="role">Your role</Label>
                <Input
                  id="role"
                  placeholder="e.g. Software Engineer, Athlete, Student"
                  {...register("role")}
                />
                {errors.role && (
                  <p className="text-sm text-destructive">
                    {errors.role.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="performanceDomain">Performance domain</Label>
                <Input
                  id="performanceDomain"
                  placeholder="e.g. Public Speaking, Sales, Competition"
                  {...register("performanceDomain")}
                />
                {errors.performanceDomain && (
                  <p className="text-sm text-destructive">
                    {errors.performanceDomain.message}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Step 1: Strengths */}
          {step === 1 && (
            <div className="space-y-2">
              <Label>Your strengths</Label>
              <Controller
                name="strengths"
                control={control}
                render={({ field }) => (
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Type a strength and press Enter"
                  />
                )}
              />
              {errors.strengths && (
                <p className="text-sm text-destructive">
                  {errors.strengths.message}
                </p>
              )}
            </div>
          )}

          {/* Step 2: Challenges */}
          {step === 2 && (
            <div className="space-y-2">
              <Label>Confidence challenges</Label>
              <Controller
                name="confidenceChallenges"
                control={control}
                render={({ field }) => (
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Type a challenge and press Enter"
                  />
                )}
              />
              {errors.confidenceChallenges && (
                <p className="text-sm text-destructive">
                  {errors.confidenceChallenges.message}
                </p>
              )}
            </div>
          )}

          {/* Step 3: Triggers */}
          {step === 3 && (
            <div className="space-y-2">
              <Label>Recurring triggers</Label>
              <Controller
                name="recurringTriggers"
                control={control}
                render={({ field }) => (
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Type a trigger and press Enter"
                  />
                )}
              />
              {errors.recurringTriggers && (
                <p className="text-sm text-destructive">
                  {errors.recurringTriggers.message}
                </p>
              )}
            </div>
          )}

          {/* Step 4: Baseline Score */}
          {step === 4 && (
            <div className="space-y-2">
              <Label>Baseline confidence score</Label>
              <Controller
                name="baselineScore"
                control={control}
                render={({ field }) => (
                  <ConfidenceScore
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.baselineScore && (
                <p className="text-sm text-destructive">
                  {errors.baselineScore.message}
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={prevStep}
              disabled={step === 0}
            >
              Back
            </Button>

            {isLast ? (
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Complete Setup"}
              </Button>
            ) : (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
