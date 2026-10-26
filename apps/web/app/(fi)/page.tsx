import {
  getDb,
  getInsights,
  listRecentDecisions,
  searchRequests,
} from "@repo/fi";
import type { Metadata } from "next";
import Link from "next/link";

import { hunchTagline } from "@/lib/hunch-content";

import {
  formatRelativeTime,
  SignalStatusBadge,
} from "./_components/signal-status";

export const metadata: Metadata = {
  description: hunchTagline,
  title: "Pulse",
};

export default async function PulsePage() {
  const db = getDb();
  const [insights30d, themes, recent, recentDecisions] = await Promise.all([
    getInsights({ db, range: "30d" }),
    getInsights({ db, range: "90d" }),
    searchRequests({ db, page: 1, pageSize: 8, sort: "published_at" }),
    listRecentDecisions({ db, limit: 8 }),
  ]);
  const insights = insights30d;
  const queueCount = insights.openQueueCount;

  const topTheme = themes.trends?.themes.at(0);
  const decisionsThisMonth = insights.sample.dispositionWithRationaleCount ?? 0;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Pulse</h1>
        <p className="text-muted-foreground text-sm">{hunchTagline}</p>
      </header>

      <dl className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <dt className="text-muted-foreground text-xs tracking-wide uppercase">
            To review
          </dt>
          <dd className="text-2xl font-semibold tabular-nums">
            <Link className="text-primary hover:underline" href="/review">
              {queueCount}
            </Link>
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground text-xs tracking-wide uppercase">
            Themes (90d)
          </dt>
          <dd className="text-2xl font-semibold tabular-nums">
            {themes.trends?.themes.length ?? "—"}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground text-xs tracking-wide uppercase">
            Decisions (30d)
          </dt>
          <dd className="text-2xl font-semibold tabular-nums">
            {decisionsThisMonth}
          </dd>
        </div>
      </dl>

      {topTheme ? (
        <section className="border-primary/30 bg-primary text-primary-foreground rounded-md border px-4 py-4 md:px-6">
          <p className="text-xs font-medium tracking-wide uppercase opacity-90">
            Top theme
          </p>
          <h2 className="mt-1 text-lg font-semibold">{topTheme.label}</h2>
          <p className="mt-1 text-sm opacity-90">
            {topTheme.count} signals in range
            {topTheme.priorCount === null ? null : (
              <>
                {" "}
                · Δ {topTheme.count - topTheme.priorCount >= 0 ? "+" : ""}
                {topTheme.count - topTheme.priorCount} vs prior period
              </>
            )}
          </p>
          <Link
            className="mt-3 inline-block text-sm font-medium underline underline-offset-2"
            href={`/signals?theme=${topTheme.themeKey}`}
          >
            View signals
          </Link>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Recent signals</h2>
          <Link
            className="text-primary text-sm hover:underline"
            href="/signals"
          >
            All signals
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-border text-muted-foreground border-b text-xs">
                <th className="pr-4 pb-2 font-medium">Title</th>
                <th className="pr-4 pb-2 font-medium">Theme</th>
                <th className="pr-4 pb-2 text-right font-medium tabular-nums">
                  Support
                </th>
                <th className="pb-2 font-medium">Received</th>
              </tr>
            </thead>
            <tbody>
              {recent.items.map((row) => (
                <tr className="border-border/60 border-b" key={row.id}>
                  <td className="py-2.5 pr-4">
                    <Link
                      className="text-primary font-medium hover:underline"
                      href={`/signals/${row.id}`}
                    >
                      {row.title}
                    </Link>
                  </td>
                  <td className="text-muted-foreground py-2.5 pr-4">
                    {row.themeLabel ?? "—"}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">
                    {row.supportCount}
                  </td>
                  <td className="text-muted-foreground py-2.5">
                    {formatRelativeTime(row.publishedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Recent decisions</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-border text-muted-foreground border-b text-xs">
                <th className="pr-4 pb-2 font-medium">Title</th>
                <th className="pr-4 pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentDecisions.length === 0 ? (
                <tr>
                  <td className="text-muted-foreground py-4" colSpan={3}>
                    No recorded decisions yet.
                  </td>
                </tr>
              ) : (
                recentDecisions.map((row) => (
                  <tr className="border-border/60 border-b" key={row.id}>
                    <td className="py-2.5 pr-4">
                      <Link
                        className="hover:underline"
                        href={`/signals/${row.id}`}
                      >
                        {row.title}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4">
                      <SignalStatusBadge disposition={row.disposition} />
                    </td>
                    <td className="text-muted-foreground py-2.5">
                      {formatRelativeTime(row.dispositionAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
