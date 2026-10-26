"use client";

import type { getInsights, InsightsRangePreset } from "@repo/fi";
import { Card, CardHeader, CardTitle } from "@repo/ui/components/card";
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

const formatMs = (ms: number | null) => {
  if (ms === null) return "—";
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60_000)}m`;
};

const SimpleBars = ({ data }: { data: { label: string; value: number }[] }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No activity in this period.
      </p>
    );
  }
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

export const InsightsDashboard = ({
  insights,
  range,
}: {
  insights: InsightsPayload;
  range: InsightsRangePreset;
}) => {
  const router = useRouter();
  const pmHeadline =
    insights.sample.pmTriageN >= 2
      ? formatMs(insights.medianPmTriageMs)
      : formatMs(insights.medianPmTriageMsProxy);
  const pmFootnote =
    insights.sample.pmTriageN < 2 && insights.medianPmTriageMsProxy !== null;

  const weekly = insights.trends?.weekly ?? [];
  const submissionBars = weekly.map((w) => ({
    label: w.weekStart.slice(5),
    value: w.submissions,
  }));
  const queueBars = weekly.map((w) => ({
    label: w.weekStart.slice(5),
    value: w.openQueueEnd,
  }));
  const dispositionBars = weekly.map((w) => ({
    label: w.weekStart.slice(5),
    value:
      w.dispositions.merge +
      w.dispositions.monitor +
      w.dispositions.decline +
      w.dispositions.needs_discussion,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Insights</h1>
          <p className="text-muted-foreground text-sm">
            Metrics from product data in Postgres; after{" "}
            <code className="text-xs">pnpm seed:fi</code>, trends reflect demo
            seed history.
          </p>
        </div>
        <Select
          onValueChange={(value) => {
            router.push(`/insights?range=${value}`);
          }}
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Decision readiness (avg)</CardTitle>
            <p className="text-2xl font-semibold">
              {formatMs(insights.avgDecisionReadinessMs)}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>PM triage (median)</CardTitle>
            <p className="text-2xl font-semibold">{pmHeadline}</p>
            {pmFootnote ? (
              <p className="text-muted-foreground text-xs">
                Proxy: published → disposition (few PM review timestamps in
                range)
              </p>
            ) : null}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open queue</CardTitle>
            <p className="text-2xl font-semibold">{insights.openQueueCount}</p>
            <p className="text-muted-foreground text-xs">Live snapshot</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Decision capture rate</CardTitle>
            <p className="text-2xl font-semibold">
              {insights.decisionCaptureRate === null
                ? "—"
                : `${(insights.decisionCaptureRate * 100).toFixed(0)}%`}
            </p>
            <p className="text-muted-foreground text-xs">Live snapshot</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Intake link rate</CardTitle>
            <p className="text-2xl font-semibold">
              {insights.intakeLinkRate === null
                ? "—"
                : `${(insights.intakeLinkRate * 100).toFixed(0)}%`}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Published in range</CardTitle>
            <p className="text-2xl font-semibold">
              {insights.sample.publishedCount}
            </p>
          </CardHeader>
        </Card>
      </div>

      {insights.trends ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Submissions per week</CardTitle>
              <SimpleBars data={submissionBars} />
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Dispositions per week</CardTitle>
              <SimpleBars data={dispositionBars} />
            </CardHeader>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Open queue at week end</CardTitle>
              <SimpleBars data={queueBars} />
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Top themes</CardTitle>
              <ul className="space-y-2 text-sm">
                {insights.trends.themes.map((t) => (
                  <li className="flex justify-between gap-2" key={t.themeKey}>
                    <span>{t.label}</span>
                    <span className="tabular-nums">
                      {t.count}
                      {t.priorCount === null ? null : (
                        <span className="text-muted-foreground">
                          {" "}
                          (Δ {t.count - t.priorCount >= 0 ? "+" : ""}
                          {t.count - t.priorCount})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Popularity vs PM judgment</CardTitle>
              <ul className="space-y-2 text-sm">
                {insights.trends.strategicVsPopular.length === 0 ? (
                  <li className="text-muted-foreground">No rows in range.</li>
                ) : (
                  insights.trends.strategicVsPopular.map((row) => (
                    <li key={row.requestId}>
                      <Link
                        className="text-primary underline"
                        href={`/requests/${row.requestId}`}
                      >
                        {row.title}
                      </Link>
                      <span className="text-muted-foreground">
                        {" "}
                        · {row.supportCount} supporters · {row.disposition}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </CardHeader>
          </Card>
        </div>
      ) : null}
    </div>
  );
};
