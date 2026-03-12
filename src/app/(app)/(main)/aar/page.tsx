import { getRecentAarSessions } from "@/lib/actions/aar";
import { AarForm } from "@/components/aar/aar-form";
import { ExpandableCard } from "@/components/shared/expandable-card";
import { Separator } from "@/components/ui/separator";

export default async function AarPage() {
  const recentSessions = await getRecentAarSessions(5);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          After Action Review
        </h1>
        <p className="mt-2 text-muted-foreground">
          Learn from what happened, why it matters, and what comes next.
        </p>
      </div>

      <AarForm />

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Recent Reviews</h2>
          <div className="space-y-4">
            {recentSessions.map((session) => {
              const input = session.inputJson as Record<string, unknown> | null;
              const output = session.outputJson as Record<string, unknown> | null;

              return (
                <ExpandableCard
                  key={session.id}
                  date={session.createdAt.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  summary={
                    input?.whatHappened ? (
                      <div>
                        <span className="font-medium">What happened:</span>{" "}
                        {String(input.whatHappened)}
                      </div>
                    ) : null
                  }
                >
                  {input?.soWhat ? (
                    <>
                      <Separator />
                      <div>
                        <span className="font-medium">So what:</span>{" "}
                        {String(input.soWhat)}
                      </div>
                    </>
                  ) : null}
                  {input?.nowWhat ? (
                    <>
                      <Separator />
                      <div>
                        <span className="font-medium">Now what:</span>{" "}
                        {String(input.nowWhat)}
                      </div>
                    </>
                  ) : null}
                  {output?.lessonsLearned ? (
                    <>
                      <Separator />
                      <div className="text-muted-foreground">
                        <span className="font-medium text-foreground">Lessons:</span>{" "}
                        {String(output.lessonsLearned)}
                      </div>
                    </>
                  ) : null}
                  {output?.improvementPlan ? (
                    <>
                      <Separator />
                      <div className="text-muted-foreground">
                        <span className="font-medium text-foreground">Plan:</span>{" "}
                        {String(output.improvementPlan)}
                      </div>
                    </>
                  ) : null}
                </ExpandableCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
