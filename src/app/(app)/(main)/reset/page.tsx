import { getRecentResetSessions } from "@/lib/actions/reset";
import { getCurrentUser } from "@/lib/utils/user";
import { ResetForm } from "@/components/reset/reset-form";
import { ExpandableCard } from "@/components/shared/expandable-card";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils/format-date";

export default async function ResetPage() {
  const [recentSessions, user] = await Promise.all([
    getRecentResetSessions(5),
    getCurrentUser(),
  ]);
  const tz = user?.profile?.timezone ?? "UTC";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Reset Routine</h1>
        <p className="mt-2 text-muted-foreground">
          Recover and recalibrate during a difficult moment.
        </p>
      </div>

      <ResetForm />

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Recent Reset Sessions</h2>
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
                    input?.eventDescription ? (
                      <div>
                        <span className="font-medium">Event:</span>{" "}
                        {String(input.eventDescription)}
                      </div>
                    ) : null
                  }
                >
                  {output?.acknowledgement ? (
                    <>
                      <Separator />
                      <div className="text-muted-foreground">
                        <span className="font-medium text-foreground">Acknowledgement:</span>{" "}
                        {String(output.acknowledgement)}
                      </div>
                    </>
                  ) : null}
                  {output?.safeguard ? (
                    <>
                      <Separator />
                      <div className="text-muted-foreground">
                        <span className="font-medium text-foreground">Safeguard:</span>{" "}
                        {String(output.safeguard)}
                      </div>
                    </>
                  ) : null}
                  {output?.nextActionCue ? (
                    <>
                      <Separator />
                      <div className="text-muted-foreground">
                        <span className="font-medium text-foreground">Next step:</span>{" "}
                        {String(output.nextActionCue)}
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
