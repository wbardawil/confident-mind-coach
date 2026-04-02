import { CHALLENGES } from "@/lib/challenges/registry";
import { getEnrollment } from "@/lib/actions/challenges";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import Link from "next/link";

export default async function ChallengesPage() {
  // Load enrollment status for each challenge
  const enrollments = await Promise.all(
    CHALLENGES.map(async (c) => ({
      challenge: c,
      enrollment: await getEnrollment(c.slug),
    })),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Challenges</h1>
        <p className="mt-2 text-muted-foreground">
          Structured programs to build specific confidence skills.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {enrollments.map(({ challenge, enrollment }) => {
          const isActive = enrollment?.status === "active";
          const isCompleted = enrollment?.status === "completed";
          const progress = enrollment
            ? `Day ${enrollment.currentDay}/${challenge.duration}`
            : null;

          return (
            <Link
              key={challenge.slug}
              href={`/challenges/${challenge.slug}`}
            >
              <Card className="transition-colors hover:border-primary h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">
                        {challenge.title}
                      </CardTitle>
                    </div>
                    {isCompleted && (
                      <Badge className="bg-green-500">Completed</Badge>
                    )}
                    {isActive && (
                      <Badge variant="secondary">{progress}</Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1">
                    {challenge.subtitle}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {challenge.duration}-day program
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
