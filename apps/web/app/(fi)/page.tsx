import {
  getDb,
  getInsights,
  listAttentionItems,
  listRecentDecisions,
} from "@repo/fi";
import type { Metadata } from "next";
import Link from "next/link";

import {
  crewdayDemoNote,
  fiSeoOverviewSubtitle,
  fiSeoOverviewTitle,
  hunchNav,
  hunchPageSubtitles,
  hunchWorkspaceLabel,
} from "@/lib/hunch-content";

import {
  formatCaptureRate,
  formatInsightMs,
  formatIntakeRate,
} from "./_components/metric-format";
import { OverviewMetricCard } from "./_components/overview-metric-card";
import {
  formatRelativeTime,
  SignalStatusBadge,
} from "./_components/signal-status";

export const metadata: Metadata = {
  title: fiSeoOverviewTitle,
};

const rationaleExcerpt = (text: string | null, max = 120) => {
  const trimmed = text?.trim() ?? "";
  if (!trimmed) return "—";
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max)}…`;
};

export default async function OverviewPage() {
  const db = getDb();
  const [insights, attention, recentDecisions] = await Promise.all([
    getInsights({ db, range: "30d" }),
    listAttentionItems({ db, limit: 8 }),
    listRecentDecisions({ db, limit: 6 }),
  ]);

  const pmHeadline =
    insights.sample.pmTriageN >= 2
      ? formatInsightMs(insights.medianPmTriageMs)
      : formatInsightMs(insights.medianPmTriageMsProxy);
  let pmFootnote: string | undefined;
  if (insights.sample.pmTriageN < 2 && insights.medianPmTriageMsProxy !== null)
    pmFootnote =
      "Proxy uses publish → decision time when review start was not recorded.";
  else if (insights.sample.pmTriageN >= 2)
    pmFootnote =
      "Elapsed time between opening review and saving a decision (includes interruptions).";

  const readinessFootnote =
    insights.sample.readinessDegradedN > 0
      ? `Includes ${insights.sample.readinessDegradedN} degraded AI run(s); readiness time does not prove brief quality.`
      : undefined;

  const themes = insights.trends?.themes.slice(0, 5) ?? [];

  return (
    <div className="space-y-10">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">
          {hunchNav.overview.label}
        </h1>
        <p className="text-muted-foreground text-sm">{fiSeoOverviewSubtitle}</p>
        <p className="text-muted-foreground text-sm">
          {hunchPageSubtitles.overview}
        </p>
        <p className="text-muted-foreground text-xs">
          {hunchWorkspaceLabel} · {crewdayDemoNote}
        </p>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Needs attention</h2>
          {attention.totalCount > attention.items.length ? (
            <Link
              className="text-primary text-sm hover:underline"
              href="/review"
            >
              View all in Triage
            </Link>
          ) : null}
        </div>
        {attention.items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nothing needs attention right now.{" "}
            <Link className="text-primary hover:underline" href="/signals">
              View feedback
            </Link>
          </p>
        ) : (
          <ul className="divide-border divide-y rounded-md border text-sm">
            {attention.items.map((item) => (
              <li
                className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
                key={item.requestId}
              >
                <div className="min-w-0 space-y-1">
                  <Link
                    className="text-primary font-medium hover:underline"
                    href={item.href}
                  >
                    {item.title}
                  </Link>
                  <p className="text-muted-foreground text-xs">{item.detail}</p>
                </div>
                <Link
                  className="text-primary shrink-0 text-xs font-medium hover:underline"
                  href={item.href}
                >
                  {item.href.startsWith("/review") ? "Review" : "Continue"}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Outcome metrics</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <OverviewMetricCard
            definition="Average time from submission to decision-ready preview (triage completed)."
            footnote={readinessFootnote}
            sampleNote={`n=${insights.sample.readinessN} submissions in range`}
            scopeLabel="Last 30 days"
            title="Decision readiness time"
            value={formatInsightMs(insights.avgDecisionReadinessMs)}
          />
          <OverviewMetricCard
            definition="Median elapsed time from starting review to recording a decision."
            footnote={pmFootnote}
            sampleNote={`n=${insights.sample.pmTriageN} direct measurements in range`}
            scopeLabel="Last 30 days"
            title="Elapsed PM review time"
            value={pmHeadline}
          />
          <OverviewMetricCard
            definition="Share of closed decisions (with rationale) versus open published queue — snapshot at query time."
            sampleNote={`${insights.sample.dispositionWithRationaleCount} decided · ${insights.openQueueCount} awaiting review`}
            scopeLabel="Live snapshot"
            title="Decision capture rate"
            value={formatCaptureRate(insights.decisionCaptureRate)}
          />
          <OverviewMetricCard
            definition="Published feedback linked to an existing request at intake confirm (distinct from PM merge)."
            sampleNote={`${insights.sample.intakeLinkCount} linked · ${insights.sample.publishedCount} published in range`}
            scopeLabel="Last 30 days"
            title="Intake link rate"
            value={formatIntakeRate(insights.intakeLinkRate)}
          />
        </dl>
        <p className="text-muted-foreground text-xs">
          Decisions recorded in the last 30 days:{" "}
          <span className="tabular-nums">
            {insights.sample.decisionsInRangeCount}
          </span>{" "}
          (by decision date, not live snapshot).
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Demand changes</h2>
          <Link
            className="text-primary text-sm hover:underline"
            href="/patterns?range=30d"
          >
            Open Insights
          </Link>
        </div>
        {themes.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Not enough data for theme comparison in this period.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {themes.map((theme) => {
              const delta =
                theme.priorCount === null
                  ? null
                  : theme.count - theme.priorCount;
              return (
                <li
                  className="border-border flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                  key={theme.themeKey}
                >
                  <span className="font-medium">{theme.label}</span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {theme.count} this period
                    {delta === null
                      ? null
                      : ` · ${delta >= 0 ? "+" : ""}${delta} vs prior`}
                  </span>
                  <Link
                    className="text-primary text-xs hover:underline"
                    href={`/signals?theme=${theme.themeKey}`}
                  >
                    View feedback
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Recent decisions</h2>
        <p className="text-muted-foreground text-xs">
          A recorded decision documents product judgment — it does not mean the
          feature shipped.
        </p>
        {recentDecisions.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No recorded decisions yet.
          </p>
        ) : (
          <ul className="divide-border divide-y rounded-md border text-sm">
            {recentDecisions.map((row) => (
              <li className="space-y-1 px-4 py-3" key={row.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    className="text-primary font-medium hover:underline"
                    href={`/signals/${row.id}`}
                  >
                    {row.title}
                  </Link>
                  <SignalStatusBadge disposition={row.disposition} />
                  <span className="text-muted-foreground text-xs">
                    {formatRelativeTime(row.dispositionAt)}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {rationaleExcerpt(row.dispositionRationale)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-muted-foreground text-xs">
        <Link className="text-primary hover:underline" href="/signals">
          View all feedback
        </Link>
      </p>
    </div>
  );
}
