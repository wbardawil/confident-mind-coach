"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface TrendPoint {
  date: string;
  cumulative: number;
}

interface LedgerTrendProps {
  trend: TrendPoint[];
}

export function LedgerTrend({ trend }: LedgerTrendProps) {
  if (trend.length === 0) return null;

  const values = trend.map((t) => t.cumulative);
  const max = Math.max(...values, 1); // avoid division by zero
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  // Format date label: "Mar 5"
  function formatDay(iso: string) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <TrendingUp className="h-5 w-5 text-green-600" />
        <div>
          <CardTitle className="text-base">14-Day Trend</CardTitle>
          <CardDescription>Cumulative confidence score over time</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1" style={{ height: 120 }}>
          {trend.map((point) => {
            const height = ((point.cumulative - min) / range) * 100;
            // Ensure at least a 4px bar for visibility
            const barHeight = Math.max(height, 3);

            return (
              <div
                key={point.date}
                className="group relative flex flex-1 flex-col items-center"
                style={{ height: "100%" }}
              >
                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background group-hover:block">
                  {formatDay(point.date)}: {point.cumulative}
                </div>
                {/* Bar */}
                <div className="mt-auto w-full">
                  <div
                    className="mx-auto w-full max-w-[20px] rounded-t bg-primary/80 transition-all hover:bg-primary"
                    style={{ height: `${barHeight}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {/* X-axis labels: show first, middle, and last */}
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{formatDay(trend[0].date)}</span>
          {trend.length > 2 && (
            <span>{formatDay(trend[Math.floor(trend.length / 2)].date)}</span>
          )}
          <span>{formatDay(trend[trend.length - 1].date)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
