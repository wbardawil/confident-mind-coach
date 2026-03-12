import {
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LedgerSummaryProps {
  totalScore: number;
  depositCount: number;
  withdrawalCount: number;
  net14d: number;
}

export function LedgerSummary({
  totalScore,
  depositCount,
  withdrawalCount,
  net14d,
}: LedgerSummaryProps) {
  const netPositive = net14d >= 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <CardTitle className="text-sm font-medium">
            Confidence Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalScore}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Lifetime total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <ArrowUpCircle className="h-5 w-5 text-green-600" />
          <CardTitle className="text-sm font-medium">Deposits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{depositCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Total entries
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <ArrowDownCircle className="h-5 w-5 text-red-500" />
          <CardTitle className="text-sm font-medium">Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{withdrawalCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Total entries
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          {netPositive ? (
            <Activity className="h-5 w-5 text-green-600" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-500" />
          )}
          <CardTitle className="text-sm font-medium">14-Day Net</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-3xl font-bold ${
              netPositive ? "text-green-600" : "text-red-500"
            }`}
          >
            {netPositive ? "+" : ""}
            {net14d}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Recent momentum
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
