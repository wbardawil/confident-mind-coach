import { getLedgerData } from "@/lib/actions/ledger";
import { getCurrentUser } from "@/lib/utils/user";
import { LedgerSummary } from "@/components/ledger/ledger-summary";
import { LedgerList } from "@/components/ledger/ledger-list";
import { LedgerTrend } from "@/components/ledger/ledger-trend";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/utils/constants";

export default async function LedgerPage() {
  const [data, user] = await Promise.all([
    getLedgerData(),
    getCurrentUser(),
  ]);
  const tz = user?.profile?.timezone ?? "UTC";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Confidence Ledger
        </h1>
        <p className="mt-2 text-muted-foreground">
          Track your confidence deposits and withdrawals.
        </p>
      </div>

      {/* ── Empty state ──────────────────────── */}
      {!data || data.recentEntries.length === 0 ? (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">No entries yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your confidence ledger is empty. Complete a coaching session to
              earn your first confidence deposit.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={ROUTES.DAILY_ESP}
                className="text-sm font-medium text-primary hover:underline"
              >
                Start a Daily ESP
              </Link>
              <Link
                href={ROUTES.PREGAME}
                className="text-sm font-medium text-primary hover:underline"
              >
                Run a Pregame
              </Link>
              <Link
                href={ROUTES.AAR}
                className="text-sm font-medium text-primary hover:underline"
              >
                Submit an AAR
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* ── Summary cards ──────────────────── */}
          <LedgerSummary
            totalScore={data.totalScore}
            depositCount={data.depositCount}
            withdrawalCount={data.withdrawalCount}
            net14d={data.net14d}
          />

          {/* ── 14-day trend ──────────────────── */}
          <LedgerTrend trend={data.trend} timezone={tz} />

          {/* ── Entry list ────────────────────── */}
          <div>
            <h2 className="mb-4 text-lg font-semibold">Recent Entries</h2>
            <LedgerList entries={data.recentEntries} timezone={tz} />
          </div>
        </div>
      )}
    </div>
  );
}
