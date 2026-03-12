import { getDashboardData } from "@/lib/actions/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Trophy,
  Sun,
  Target,
  ClipboardList,
  TrendingUp,
  Sparkles,
  Activity,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/utils/constants";

const MODE_LABELS: Record<string, { label: string; href: string }> = {
  ESP: { label: "Daily ESP", href: ROUTES.DAILY_ESP },
  PREGAME: { label: "Pregame", href: ROUTES.PREGAME },
  RESET: { label: "Reset", href: ROUTES.RESET },
  AAR: { label: "AAR", href: ROUTES.AAR },
};

export default async function DashboardPage() {
  const data = await getDashboardData();
  const name = data?.userName ?? "there";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your confidence overview at a glance.
        </p>
      </div>

      {/* ── Quick nav ────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={ROUTES.DAILY_ESP}>
          <Card className="transition-colors hover:border-primary">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Sun className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Daily ESP</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Reflect on Effort, Success, Progress.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href={ROUTES.TOP_TEN}>
          <Card className="transition-colors hover:border-primary">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Trophy className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Top Ten</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Review your accomplishments.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href={ROUTES.PREGAME}>
          <Card className="transition-colors hover:border-primary">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Pregame</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Prepare before an event.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href={ROUTES.AAR}>
          <Card className="transition-colors hover:border-primary">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">AAR</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                After Action Review.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>

      {data && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* ── Confidence Score ───────────────── */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <CardTitle className="text-base">Confidence Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {data.confidenceScore}
                </span>
                <span className="text-sm text-muted-foreground">
                  total points
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Earned through your daily reflections, preparations, and reviews.
              </p>
              <Link
                href={ROUTES.LEDGER}
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
              >
                View full ledger
              </Link>
            </CardContent>
          </Card>

          {/* ── Recent Sessions ────────────────── */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No coaching sessions yet. Start with a Daily ESP!
                </p>
              ) : (
                <div className="space-y-3">
                  {data.recentSessions.map((session) => {
                    const meta = MODE_LABELS[session.mode];
                    return (
                      <div key={session.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {meta?.label ?? session.mode}
                          </Badge>
                          <span className="text-muted-foreground">
                            {session.createdAt.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        {meta && (
                          <Link
                            href={meta.href}
                            className="text-xs text-primary hover:underline"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Recent Affirmations ────────────── */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Recent Affirmations</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentAffirmations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Complete a Daily ESP to receive your first affirmation.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.recentAffirmations.map((aff) => (
                    <div key={aff.id}>
                      <p className="text-sm italic leading-relaxed">
                        &ldquo;{aff.text}&rdquo;
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {aff.createdAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                        {" via "}
                        {aff.source}
                      </p>
                      <Separator className="mt-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Recent ESP Entries ─────────────── */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <RefreshCw className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">Recent ESP Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentEspEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No ESP reflections yet.{" "}
                  <Link href={ROUTES.DAILY_ESP} className="text-primary hover:underline">
                    Start one now
                  </Link>
                </p>
              ) : (
                <div className="space-y-3">
                  {data.recentEspEntries.map((entry) => (
                    <div key={entry.id}>
                      <p className="text-sm">
                        <span className="font-medium">Effort:</span>{" "}
                        {entry.effort.length > 80
                          ? entry.effort.slice(0, 80) + "..."
                          : entry.effort}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {entry.createdAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <Separator className="mt-2" />
                    </div>
                  ))}
                </div>
              )}
              <Link
                href={ROUTES.DAILY_ESP}
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
              >
                Go to Daily ESP
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
