import { getDb, listTriageQueue, searchRequests } from "@repo/fi";
import type { TriageQueueSort } from "@repo/fi";
import { Badge } from "@repo/ui/components/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@repo/ui/components/empty";
import Link from "next/link";

import { TriagePanel } from "./triage-panel";

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
  const { items: mergeTargets } = await searchRequests({
    db,
    pageSize: 100,
    sort: "title",
  });

  const selected = queue.find((row) => row.id === focus) ?? queue.at(0) ?? null;

  let sortLabel = "support";
  if (sort === "newest") sortLabel = "newest first";
  else if (sort === "oldest") sortLabel = "oldest first";

  const sortQs = (id: string) => {
    const sp = new URLSearchParams();
    if (sort !== "support") sp.set("sort", sort);
    sp.set("focus", id);
    return `/review?${sp.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Review</h1>
          <p className="text-muted-foreground text-sm">
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
              No open items need review right now.
            </EmptyDescription>
          </EmptyHeader>
          <Link className="text-primary text-sm underline" href="/patterns">
            View Patterns
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
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Problem</h3>
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
                    <h3 className="text-sm font-semibold">Desired outcome</h3>
                    <p className="text-sm">{selected.decisionBrief}</p>
                  </div>
                ) : null}
              </section>

              <aside className="border-border space-y-4 border-t pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4">
                <section className="rounded-md border border-amber-200/80 bg-amber-50/80 p-3 text-sm dark:border-amber-900/40 dark:bg-amber-950/30">
                  <h3 className="font-semibold">Hunch suggestion</h3>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Not a recorded decision — review evidence before merging or
                    monitoring.
                  </p>
                  <p className="mt-2 text-sm">
                    Compare wording with related signals and duplicate
                    candidates from triage before choosing merge or monitor.
                  </p>
                </section>
                <TriagePanel
                  brief={selected.decisionBrief}
                  mergeTargets={mergeTargets.map((t) => ({
                    id: t.id,
                    title: t.title,
                  }))}
                  requestId={selected.id}
                />
              </aside>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
