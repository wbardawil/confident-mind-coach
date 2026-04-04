import { getRecentPregameSessions } from "@/lib/actions/pregame";
import { getCurrentUser } from "@/lib/utils/user";
import { PregameForm } from "@/components/pregame/pregame-form";
import { ExpandableCard } from "@/components/shared/expandable-card";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils/format-date";

export default async function PregamePage() {
  const [recentSessions, user] = await Promise.all([
    getRecentPregameSessions(5),
    getCurrentUser(),
  ]);
  const tz = user?.profile?.timezone ?? "UTC";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Pregame Routine</h1>
        <p className="mt-2 text-muted-foreground">
          Prepare your mind before an important event.
        </p>
      </div>

      <PregameForm />

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Recent Pregame Sessions</h2>
          <div className="space-y-4">
            {recentSessions.map((session) => {
              const input = session.inputJson as Record<string, unknown> | null;
              const output = session.outputJson as Record<string, unknown> | null;

              return (
                <ExpandableCard
                  key={session.id}
                  date={formatDate(session.createdAt, tz, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  summary={
                    input?.upcomingEvent ? (
                      <div>
                        <span className="font-medium">Event:</span>{" "}
                        {String(input.upcomingEvent)}
                      </div>
                    ) : null
                  }
                >
                  {output?.takeStock ? (
                    <>
                      <Separator />
                      <div className="text-muted-foreground">
                        <span className="font-medium text-foreground">Take Stock:</span>{" "}
                        {String(output.takeStock)}
                      </div>
                    </>
                  ) : null}
                  {output?.situationAssessment ? (
                    <>
                      <Separator />
                      <div className="text-muted-foreground">
                        <span className="font-medium text-foreground">Assessment:</span>{" "}
                        {String(output.situationAssessment)}
                      </div>
                    </>
                  ) : null}
                  {output?.enoughStatement ? (
                    <>
                      <Separator />
                      <div className="italic text-primary">
                        &ldquo;{String(output.enoughStatement)}&rdquo;
                      </div>
                    </>
                  ) : null}
                  {output?.visualizationPrompt ? (
                    <>
                      <Separator />
                      <div className="text-muted-foreground">
                        <span className="font-medium text-foreground">Visualization:</span>{" "}
                        {String(output.visualizationPrompt)}
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
