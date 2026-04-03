import { getDashboardData } from "@/lib/actions/dashboard";
import { formatDateShort } from "@/lib/utils/format-date";
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
  MessageCircle,
  Sun,
  Zap,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Activity,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/utils/constants";

const MODE_LABELS: Record<string, { label: string; href: string }> = {
  ESP: { label: "Daily ESP", href: ROUTES.DAILY_ESP },
  PREGAME: { label: "Pregame", href: ROUTES.PREGAME },
  RESET: { label: "Reset", href: ROUTES.RESET },
  AAR: { label: "AAR", href: ROUTES.AAR },
};

export async function DashboardContent() {
  const data = await getDashboardData();
  const name = data?.userName ?? "there";

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      {/* ── Greeting + Insight ──────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}, {name}
        </h1>
        {data && (
          <p className="mt-1 text-muted-foreground">
            Your confidence is at{" "}
            <span className="font-semibold text-foreground">
              {data.confidenceScore > 0 ? "+" : ""}
              {data.confidenceScore}
            </span>
            {data.net14d !== 0 && (
              <>
                {" "}and{" "}
                <span
                  className={
                    data.net14d >= 0 ? "text-green-600" : "text-red-500"
                  }
                >
                  {data.net14d >= 0 ? "trending up" : "trending down"} (
                  {data.net14d >= 0 ? "+" : ""}
                  {data.net14d})
                </span>{" "}
                this week
              </>
            )}
          </p>
        )}
      </div>

      {/* ── Recommended Action (ONE prominent card) ── */}
      {data?.recommendedAction && (
        <Link href={data.recommendedAction.href}>
          <Card className="mb-6 border-primary bg-primary/5 transition-colors hover:bg-primary/10">
            <CardContent className="flex items-center justify-between py-5">
              <div>
                <p className="text-lg font-semibold">
                  {data.recommendedAction.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.recommendedAction.description}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* ── Quick Access Row ────────────────── */}
      <div className="mb-6 flex gap-3">
        <Link href={ROUTES.COACH} className="flex-1">
          <Card className="transition-colors hover:border-primary">
            <CardContent className="flex flex-col items-center gap-1 py-4">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs font-medium">Coach</span>
            </CardContent>
          </Card>
        </Link>
        <Link href={ROUTES.DAILY_ESP} className="flex-1">
          <Card className="transition-colors hover:border-primary">
            <CardContent className="flex flex-col items-center gap-1 py-4">
              <Sun className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs font-medium">ESP</span>
            </CardContent>
          </Card>
        </Link>
        <Link href={ROUTES.INSTANT_RESET} className="flex-1">
          <Card className="transition-colors hover:border-red-500/50">
            <CardContent className="flex flex-col items-center gap-1 py-4">
              <Zap className="h-5 w-5 text-red-500" />
              <span className="text-xs font-medium">Reset</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {data && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Confidence Score ───────────────── */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              {data.net14d >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
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
                            {formatDateShort(session.createdAt, data.timezone)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Latest Affirmation ─────────────── */}
          {data.recentAffirmations.length > 0 && (
            <Card className="border-primary/20 bg-primary/5 lg:col-span-2">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Your Affirmation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm italic leading-relaxed">
                  &ldquo;{data.recentAffirmations[0].text}&rdquo;
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
