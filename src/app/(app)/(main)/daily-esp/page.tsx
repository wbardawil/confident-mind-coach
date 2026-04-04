import { getRecentEspSessions } from "@/lib/actions/esp";
import { getCurrentUser } from "@/lib/utils/user";
import { EspForm } from "@/components/daily-esp/esp-form";
import { ExpandableCard } from "@/components/shared/expandable-card";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils/format-date";

export default async function DailyEspPage() {
  const [recentSessions, user] = await Promise.all([
    getRecentEspSessions(5),
    getCurrentUser(),
  ]);
  const tz = user?.profile?.timezone ?? "UTC";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Daily ESP</h1>
        <p className="mt-2 text-muted-foreground">
          Reflect on your Effort, Success, and Progress.
        </p>
      </div>

      <EspForm />

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Recent Reflections</h2>
          <div className="space-y-4">
            {recentSessions.map((session) => {
              const input = session.inputJson as Record<string, unknown> | null;
              const output = session.outputJson as Record<string, unknown> | null;
              const ledger = output?.ledgerImpact as Record<string, unknown> | null;

              return (
                <ExpandableCard
                  key={session.id}
                  date={formatDate(session.createdAt, tz, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  summary={
                    input?.effort ? (
                      <div>
                        <span className="font-medium">Effort:</span>{" "}
                        {String(input.effort)}
                      </div>
                    ) : null
                  }
                >
                  {input?.success ? (
                    <>
                      <Separator />
                      <div>
                        <span className="font-medium">Success:</span>{" "}
                        {String(input.success)}
                      </div>
                    </>
                  ) : null}
                  {input?.progress ? (
                    <>
                      <Separator />
                      <div>
                        <span className="font-medium">Progress:</span>{" "}
                        {String(input.progress)}
                      </div>
                    </>
                  ) : null}
                  {output?.reflection ? (
                    <>
                      <Separator />
                      <div className="text-muted-foreground">
                        <span className="font-medium text-foreground">Coaching:</span>{" "}
                        {String(output.reflection)}
                      </div>
                    </>
                  ) : null}
                  {output?.affirmation ? (
                    <>
                      <Separator />
                      <div className="italic text-primary">
                        &ldquo;{String(output.affirmation)}&rdquo;
                      </div>
                    </>
                  ) : null}
                  {ledger?.title ? (
                    <>
                      <Separator />
                      <div className="text-muted-foreground">
                        <span className="font-medium text-foreground">Deposit:</span>{" "}
                        {String(ledger.title)} (+{String(ledger.scoreDelta)})
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
