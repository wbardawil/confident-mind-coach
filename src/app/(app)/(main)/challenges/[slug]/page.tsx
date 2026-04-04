import { notFound } from "next/navigation";
import { getChallengeBySlug } from "@/lib/challenges/registry";
import { getEnrollment, enrollInChallenge } from "@/lib/actions/challenges";
import { ChallengeDayForm } from "@/components/challenges/challenge-day-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Circle, Lock, Trophy } from "lucide-react";
import Link from "next/link";

interface ChallengePageProps {
  params: { slug: string };
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const challenge = getChallengeBySlug(params.slug);
  if (!challenge) notFound();

  // Auto-enroll on first visit
  let enrollment = await getEnrollment(params.slug);
  if (!enrollment) {
    await enrollInChallenge(params.slug);
    enrollment = await getEnrollment(params.slug);
  }

  const completedDays = new Set(
    enrollment?.dayEntries.map((e) => e.day) ?? [],
  );
  const currentDay = enrollment?.currentDay ?? 1;
  const isCompleted = enrollment?.status === "completed";

  // Find AI response for the current day if already submitted
  const currentDayEntry = enrollment?.dayEntries.find(
    (e) => e.day === currentDay,
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {challenge.title}
          </h1>
          {isCompleted && (
            <Badge className="bg-green-500">Completed</Badge>
          )}
        </div>
        <p className="text-muted-foreground">{challenge.subtitle}</p>
      </div>

      {/* Completion celebration */}
      {isCompleted && (
        <Card className="mb-6 border-green-500/30 bg-green-500/5">
          <CardContent className="flex items-center gap-4 py-6">
            <Trophy className="h-10 w-10 text-yellow-500" />
            <div>
              <p className="font-semibold text-lg">Challenge Complete!</p>
              <p className="text-sm text-muted-foreground">
                You showed up for {challenge.duration} days and did the work.
                That itself is evidence against being a fraud.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress tracker */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {challenge.days.map((day) => {
          const isDone = completedDays.has(day.day);
          const isCurrent = day.day === currentDay && !isCompleted;
          const isLocked = day.day > currentDay && !isCompleted;

          return (
            <div
              key={day.day}
              className={`flex flex-col items-center gap-1 min-w-[3rem] ${
                isCurrent ? "opacity-100" : isLocked ? "opacity-40" : "opacity-70"
              }`}
            >
              {isDone ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : isCurrent ? (
                <Circle className="h-6 w-6 text-primary fill-primary/20" />
              ) : (
                <Lock className="h-6 w-6 text-muted-foreground" />
              )}
              <span className="text-xs font-medium">
                {day.day}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current day form or review of completed days */}
      {!isCompleted && (
        <ChallengeDayForm
          challengeSlug={challenge.slug}
          day={challenge.days[currentDay - 1]}
          existingResponse={currentDayEntry?.aiResponse}
        />
      )}

      {/* Past day entries */}
      {enrollment && enrollment.dayEntries.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Past Days
          </h2>
          {[...enrollment.dayEntries]
            .sort((a, b) => b.day - a.day)
            .map((entry) => {
              const dayConfig = challenge.days[entry.day - 1];
              return (
                <Card key={entry.id} className="opacity-80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Day {entry.day}: {dayConfig?.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {entry.completedAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-muted-foreground">{entry.reflection}</p>
                    {entry.aiResponse && (
                      <p className="italic border-l-2 border-primary/30 pl-3">
                        {entry.aiResponse}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/challenges"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Back to Challenges
        </Link>
      </div>
    </div>
  );
}
