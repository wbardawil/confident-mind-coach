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

/** Height of the chart area in pixels. */
const CHART_HEIGHT = 120;
/** Minimum bar height so flat/zero series remain visible. */
const MIN_BAR_PX = 4;

export function LedgerTrend({ trend }: LedgerTrendProps) {
  if (trend.length === 0) return null;

  const values = trend.map((t) => t.cumulative);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

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
        <div className="flex items-end gap-1" style={{ height: CHART_HEIGHT }}>
          {trend.map((point) => {
            // When the series is flat (range === 0), show bars at half height
            const ratio = range === 0 ? 0.5 : (point.cumulative - min) / range;
            const barPx = Math.max(Math.round(ratio * CHART_HEIGHT), MIN_BAR_PX);

            return (
              <div
                key={point.date}
                className="group relative flex flex-1 items-end justify-center"
                style={{ height: CHART_HEIGHT }}
              >
                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background group-hover:block">
                  {formatDay(point.date)}: {point.cumulative}
                </div>
                {/* Bar */}
                <div
                  className="w-full max-w-[20px] rounded-t bg-primary/80 transition-all hover:bg-primary"
                  style={{ height: barPx }}
                />
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
