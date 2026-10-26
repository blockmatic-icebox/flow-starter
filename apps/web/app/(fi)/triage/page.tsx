import {
  getDb,
  getRequest,
  isTriageDegraded,
  listTriageQueue,
  searchRequests,
} from "@repo/fi";
import type { TriageQueueSort, TriageStepsPayload } from "@repo/fi";
import { Badge } from "@repo/ui/components/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@repo/ui/components/empty";
import type { Metadata } from "next";
import Link from "next/link";

import { hunchNav, hunchPageSubtitles } from "@/lib/hunch-content";

import { TriagePanel } from "./triage-panel";

export const metadata: Metadata = {
  title: hunchNav.triage.label,
};

export default async function TriagePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; focus?: string }>;
}) {
  const { sort: sortParam, focus } = await searchParams;
  const sort: TriageQueueSort =
    sortParam === "newest" || sortParam === "oldest" ? sortParam : "support";

  const db = getDb();
  const queue = await listTriageQueue({ db, sort });
  const queueIds = queue.map((row) => row.id);
  const { items: mergeTargets } = await searchRequests({
    db,
    pageSize: 100,
    sort: "title",
  });

  const selected = queue.find((row) => row.id === focus) ?? queue.at(0) ?? null;

  const detail = selected
    ? await getRequest({ db, requestId: selected.id })
    : null;

  let sortLabel = "support";
  if (sort === "newest") sortLabel = "newest first";
  else if (sort === "oldest") sortLabel = "oldest first";

  const sortQs = (id: string) => {
    const sp = new URLSearchParams();
    if (sort !== "support") sp.set("sort", sort);
    sp.set("focus", id);
    return `/review?${sp.toString()}`;
  };

  const triageSteps = selected?.triageSteps as TriageStepsPayload | null;
  const degraded = isTriageDegraded(triageSteps);

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-muted-foreground text-xs">
        <Link className="hover:underline" href="/">
          Overview
        </Link>
        {" / "}
        <span>{hunchNav.triage.label}</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            {hunchNav.triage.label}
          </h1>
          <p className="text-muted-foreground text-sm">
            {hunchPageSubtitles.triage}
          </p>
          <p className="text-muted-foreground mt-1 text-xs tabular-nums">
            {queue.length} awaiting review · sorted by {sortLabel}
          </p>
        </div>
        <form action="/review" className="flex gap-2" method="get">
          {focus ? <input name="focus" type="hidden" value={focus} /> : null}
          <select
            className="border-input rounded-md border px-3 py-2 text-sm"
            defaultValue={sort}
            name="sort"
          >
            <option value="support">Sort: support</option>
            <option value="newest">Sort: newest</option>
            <option value="oldest">Sort: oldest</option>
          </select>
          <button
            className="border-input rounded-md border px-3 py-2 text-sm"
            type="submit"
          >
            Apply
          </button>
        </form>
      </div>

      {queue.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Queue is clear</EmptyTitle>
            <EmptyDescription>
              No published feedback needs a decision right now.
            </EmptyDescription>
          </EmptyHeader>
          <Link className="text-primary text-sm underline" href="/patterns">
            View Insights
          </Link>
        </Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)_17rem]">
          <aside aria-label="Awaiting review" className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium uppercase">
              Awaiting review ({queue.length})
            </p>
            <ul className="divide-border divide-y text-sm">
              {queue.map((row) => (
                <li key={row.id}>
                  <Link
                    className={`block rounded-md px-2 py-2 ${
                      selected?.id === row.id
                        ? "bg-muted font-medium"
                        : "hover:bg-muted/60"
                    }`}
                    href={sortQs(row.id)}
                  >
                    <span className="line-clamp-2">{row.title}</span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {row.supportCount ?? 0} support
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          {selected ? (
            <>
              <section className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold">{selected.title}</h2>
                  <Badge variant="secondary">
                    {selected.supportCount ?? 0} supporters
                  </Badge>
                  <Link
                    className="text-primary text-xs hover:underline"
                    href={`/signals/${selected.id}`}
                  >
                    View feedback
                  </Link>
                </div>
                {degraded ? (
                  <output className="block rounded-md border border-amber-200/80 bg-amber-50/80 p-3 text-sm dark:border-amber-900/40 dark:bg-amber-950/30">
                    <p className="font-medium">Degraded AI processing</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Triage output may be incomplete. Verify problem statement
                      and brief before recording a decision.
                    </p>
                  </output>
                ) : null}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Problem (persisted)</h3>
                  <p className="text-sm leading-relaxed">
                    {selected.problemStatement ?? selected.description}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Customer evidence</h3>
                  <blockquote className="border-primary/40 border-l-2 pl-4 text-sm italic">
                    {selected.description}
                  </blockquote>
                </div>
                {selected.decisionBrief ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">
                      Brief (AI suggestion)
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {selected.decisionBrief}
                    </p>
                  </div>
                ) : null}
                {detail && detail.duplicates.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">
                      Duplicate candidates
                    </h3>
                    <ul className="space-y-1 text-sm">
                      {detail.duplicates.map((d) => (
                        <li key={d.id}>
                          <Link
                            className="text-primary hover:underline"
                            href={`/signals/${d.candidateRequestId}`}
                          >
                            {d.title}
                          </Link>
                          <span className="text-muted-foreground text-xs">
                            {" "}
                            — {d.explanation}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>

              <aside className="border-border space-y-4 border-t pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4">
                <section className="rounded-md border border-amber-200/80 bg-amber-50/80 p-3 text-sm dark:border-amber-900/40 dark:bg-amber-950/30">
                  <h3 className="font-semibold">Hunch suggestion</h3>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Not a recorded decision — compare evidence and duplicate
                    candidates before you choose merge or monitor.
                  </p>
                </section>
                <TriagePanel
                  brief={selected.decisionBrief}
                  mergeTargets={mergeTargets.map((t) => ({
                    id: t.id,
                    title: t.title,
                  }))}
                  queueIds={queueIds}
                  requestId={selected.id}
                  sort={sort}
                />
              </aside>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
