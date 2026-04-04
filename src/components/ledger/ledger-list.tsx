import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface LedgerEntry {
  id: string;
  type: string;
  title: string;
  description: string | null;
  scoreDelta: number | null;
  sourceType: string | null;
  createdAt: Date;
}

const SOURCE_LABELS: Record<string, string> = {
  ESP: "Daily ESP",
  PREGAME: "Pregame",
  RESET: "Reset",
  AAR: "AAR",
  TOP_TEN: "Top Ten",
  MANUAL: "Manual",
};

interface LedgerListProps {
  entries: LedgerEntry[];
  timezone?: string;
}

export function LedgerList({ entries, timezone = "UTC" }: LedgerListProps) {
  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const isWithdrawal = entry.type === "WITHDRAWAL";

        return (
          <Card
            key={entry.id}
            className={
              isWithdrawal
                ? "border-red-200 dark:border-red-900/40"
                : "border-green-200 dark:border-green-900/40"
            }
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isWithdrawal ? (
                    <ArrowDownCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <ArrowUpCircle className="h-4 w-4 text-green-600" />
                  )}
                  <CardDescription>
                    {entry.createdAt.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      timeZone: timezone,
                    })}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {entry.sourceType && (
                    <Badge variant="outline" className="text-xs">
                      {SOURCE_LABELS[entry.sourceType] ?? entry.sourceType}
                    </Badge>
                  )}
                  {entry.scoreDelta != null && (
                    <Badge
                      variant={isWithdrawal ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {entry.scoreDelta >= 0 ? "+" : ""}
                      {entry.scoreDelta}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{entry.title}</p>
              {entry.description && (
                <>
                  <Separator className="my-2" />
                  <p className="text-muted-foreground">{entry.description}</p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
