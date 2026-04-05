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
  daily: number;
}

interface LedgerTrendProps {
  trend: TrendPoint[];
  timezone?: string;
}

/** Height of the chart area in pixels. */
const CHART_HEIGHT = 120;
/** Minimum bar height so flat/zero series remain visible. */
const MIN_BAR_PX = 4;
/** Daily overlay is at most 40% of the cumulative bar. */
const MAX_DAILY_RATIO = 0.4;

export function LedgerTrend({ trend, timezone = "UTC" }: LedgerTrendProps) {
  if (trend.length === 0) return null;

  const values = trend.map((t) => t.cumulative);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

  const maxDaily = Math.max(...trend.map((t) => Math.abs(t.daily)), 1);

  // Format date label: "Mar 5" in user's timezone
  function formatDay(iso: string) {
    const d = new Date(iso + "T12:00:00Z"); // noon UTC avoids day-shift
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: timezone });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <TrendingUp className="h-5 w-5 text-green-600" />
        <div>
          <CardTitle className="text-base">14-Day Trend</CardTitle>
          <CardDescription>Cumulative score & daily activity</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1" style={{ height: CHART_HEIGHT }}>
          {trend.map((point) => {
            // When the series is flat (range === 0), show bars at half height
            const ratio = range === 0 ? 0.5 : (point.cumulative - min) / range;
            const barPx = Math.max(Math.round(ratio * CHART_HEIGHT), MIN_BAR_PX);

            // Daily overlay height
            const dailyPx =
              point.daily !== 0
                ? Math.max(
                    Math.round(
                      (Math.abs(point.daily) / maxDaily) *
                        barPx *
                        MAX_DAILY_RATIO
                    ),
                    2
                  )
                : 0;

            return (
              <div
                key={point.date}
                className="group relative flex flex-1 items-end justify-center"
                style={{ height: CHART_HEIGHT }}
              >
                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background group-hover:block">
                  <div>
                    {formatDay(point.date)}: {point.cumulative} pts
                  </div>
                  <div
                    className={
                      point.daily > 0
                        ? "text-green-300"
                        : point.daily < 0
                          ? "text-red-300"
                          : ""
                    }
                  >
                    {point.daily > 0 ? "+" : ""}
                    {point.daily} today
                  </div>
                </div>
                {/* Cumulative bar */}
                <div
                  className="relative w-full max-w-[20px] rounded-t bg-primary/80 transition-all hover:bg-primary"
                  style={{ height: barPx }}
                >
                  {/* Daily delta overlay */}
                  {dailyPx > 0 && (
                    <div
                      className={`absolute bottom-0 left-0 w-full rounded-t ${
                        point.daily > 0
                          ? "bg-green-400/70"
                          : "bg-red-400/70"
                      }`}
                      style={{ height: dailyPx }}
                    />
                  )}
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
        {/* Legend */}
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm bg-primary/80" />
            Cumulative
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm bg-green-400/70" />
            Daily +
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm bg-red-400/70" />
            Daily −
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
