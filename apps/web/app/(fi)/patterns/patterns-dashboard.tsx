"use client";

import type { getInsights, InsightsRangePreset } from "@repo/fi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import Link from "next/link";
import { useRouter } from "next/navigation";

type InsightsPayload = Awaited<ReturnType<typeof getInsights>>;

const SimpleBars = ({ data }: { data: { label: string; value: number }[] }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  if (data.length === 0)
    return (
      <p className="text-muted-foreground text-sm">
        No activity in this period.
      </p>
    );
  return (
    <ul className="space-y-2">
      {data.map((d) => (
        <li className="flex items-center gap-2 text-sm" key={d.label}>
          <span className="text-muted-foreground w-16 shrink-0">{d.label}</span>
          <div className="bg-muted h-2 flex-1 rounded-full">
            <div
              className="bg-primary h-2 rounded-full"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right tabular-nums">{d.value}</span>
        </li>
      ))}
    </ul>
  );
};

export const PatternsDashboard = ({
  insights,
  range,
}: {
  insights: InsightsPayload;
  range: InsightsRangePreset;
}) => {
  const router = useRouter();
  const weekly = insights.trends?.weekly ?? [];
  const submissionBars = weekly.map((w) => ({
    label: w.weekStart.slice(5),
    value: w.submissions,
  }));
  const topTheme = insights.trends?.themes.at(0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <header className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Patterns</h1>
          <p className="text-muted-foreground text-sm">
            Grounded trends from recorded feedback and decisions.
          </p>
        </header>
        <Select
          onValueChange={(value) => router.push(`/patterns?range=${value}`)}
          value={range}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground text-xs uppercase">
            Signals received
          </dt>
          <dd className="text-2xl font-semibold tabular-nums">
            {insights.sample.publishedCount}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs uppercase">
            Decisions recorded
          </dt>
          <dd className="text-2xl font-semibold tabular-nums">
            {insights.sample.dispositionWithRationaleCount}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs uppercase">
            Awaiting review
          </dt>
          <dd className="text-2xl font-semibold tabular-nums">
            <Link className="text-primary hover:underline" href="/review">
              {insights.openQueueCount}
            </Link>
          </dd>
        </div>
      </dl>

      {topTheme ? (
        <section className="border-border bg-muted/30 rounded-md border p-4">
          <p className="text-sm font-medium">
            {topTheme.label} requests are prominent
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {topTheme.count} signals in range
            {topTheme.priorCount === null ? null : (
              <>
                {" "}
                (Δ {topTheme.count - topTheme.priorCount >= 0 ? "+" : ""}
                {topTheme.count - topTheme.priorCount})
              </>
            )}
          </p>
          <Link
            className="text-primary mt-2 inline-block text-sm underline"
            href={`/signals?theme=${topTheme.themeKey}`}
          >
            View supporting signals
          </Link>
        </section>
      ) : null}

      {insights.trends ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Signals by theme</h2>
            <ul className="space-y-2 text-sm">
              {(() => {
                const themeTrends = insights.trends.themes;
                const maxThemeCount = Math.max(
                  ...themeTrends.map((x) => x.count),
                  1
                );
                return themeTrends.map((t) => (
                  <li className="flex items-center gap-2" key={t.themeKey}>
                    <span className="min-w-0 flex-1 truncate">{t.label}</span>
                    <div className="bg-muted h-2 w-24 rounded-full">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (t.count / maxThemeCount) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right tabular-nums">
                      {t.count}
                    </span>
                  </li>
                ));
              })()}
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Feedback volume</h2>
            <SimpleBars data={submissionBars} />
          </section>
          <section className="space-y-3 lg:col-span-2">
            <h2 className="text-sm font-semibold">Recent outcomes</h2>
            <ul className="divide-border divide-y text-sm">
              {insights.trends.strategicVsPopular.slice(0, 8).map((row) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                  key={row.requestId}
                >
                  <Link
                    className="text-primary hover:underline"
                    href={`/signals/${row.requestId}`}
                  >
                    {row.title}
                  </Link>
                  <span className="text-muted-foreground tabular-nums">
                    {row.supportCount} support · {row.disposition}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
};
