"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
import { ConfidenceScore } from "@/components/shared/confidence-score";
import { TagInput } from "@/components/shared/tag-input";
import {
  updateSettings,
  type UserSettings,
  type UpdateSettingsResult,
} from "@/lib/actions/settings";
import {
  settingsInputSchema,
  COACH_MODEL_OPTIONS,
  LANGUAGE_OPTIONS,
  type SettingsInput,
} from "@/lib/validators/settings";

interface SettingsFormProps {
  settings: UserSettings;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<UpdateSettingsResult | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (result?.success) {
      dismissTimer.current = setTimeout(() => setResult(null), 2000);
    }
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [result]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsInputSchema),
    defaultValues: {
      displayName: settings.displayName ?? "",
      coachModel: (settings.coachModel as "haiku-4.5" | "sonnet-3.5" | "sonnet-4" | "opus-3") ?? "haiku-4.5",
      language: settings.language ?? "English",
      role: settings.role ?? "",
      performanceDomain: settings.performanceDomain ?? "",
      baselineScore: settings.baselineScore ?? 5,
      strengths: settings.strengths,
      confidenceChallenges: settings.confidenceChallenges,
    },
  });

  function onSubmit(data: SettingsInput) {
    setResult(null);
    startTransition(async () => {
      const res = await updateSettings(data);
      setResult(res);
      if (res.success) reset(data);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <fieldset disabled={isPending}>
        {/* Account section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="How should we address you?"
                {...register("displayName")}
              />
              {errors.displayName && (
                <p className="text-sm text-destructive">
                  {errors.displayName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              {settings.isDevAccount ? (
                <>
                  <p className="text-sm font-medium">Development Account</p>
                  <p className="text-xs text-muted-foreground">
                    Authentication provider not configured.
                  </p>
                </>
              ) : (
                <>
                  <Input value={settings.email} disabled />
                  {settings.isClerkManaged && (
                    <p className="text-xs text-muted-foreground">
                      Managed by your authentication provider.
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label>Member since</Label>
              <p className="text-sm text-muted-foreground">
                {settings.memberSince.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Coach model selection */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Coach Model</CardTitle>
            <CardDescription>
              Choose the AI model that powers your coaching conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {COACH_MODEL_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent/50 ${
                    register("coachModel").name ? "" : ""
                  }`}
                >
                  <input
                    type="radio"
                    value={option.value}
                    {...register("coachModel")}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            {errors.coachModel && (
              <p className="text-sm text-destructive mt-2">
                {errors.coachModel.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Language selection */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Coaching Language</CardTitle>
            <CardDescription>
              Your coach will respond entirely in this language
            </CardDescription>
          </CardHeader>
          <CardContent>
            <select
              {...register("language")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Coaching profile section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Coaching Profile</CardTitle>
            <CardDescription>
              Your performance identity and focus areas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                placeholder="e.g. athlete, executive, musician"
                {...register("role")}
              />
              {errors.role && (
                <p className="text-sm text-destructive">
                  {errors.role.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="performanceDomain">Performance Domain</Label>
              <Input
                id="performanceDomain"
                placeholder="e.g. competitive tennis, sales leadership"
                {...register("performanceDomain")}
              />
              {errors.performanceDomain && (
                <p className="text-sm text-destructive">
                  {errors.performanceDomain.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Baseline Confidence</Label>
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

            <div className="space-y-2">
              <Label>Strengths</Label>
              <Controller
                name="strengths"
                control={control}
                render={({ field }) => (
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Add a strength and press Enter"
                  />
                )}
              />
              {errors.strengths && (
                <p className="text-sm text-destructive">
                  {errors.strengths.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Confidence Challenges</Label>
              <Controller
                name="confidenceChallenges"
                control={control}
                render={({ field }) => (
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Add a challenge and press Enter"
                  />
                )}
              />
              {errors.confidenceChallenges && (
                <p className="text-sm text-destructive">
                  {errors.confidenceChallenges.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </fieldset>

      {/* Status + Save */}
      <div className="flex items-center justify-between">
        <div>
          {result?.success && (
            <p className="text-sm text-green-600">Profile updated successfully</p>
          )}
          {result && !result.success && (
            <p className="text-sm text-destructive">{result.error}</p>
          )}
        </div>
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
