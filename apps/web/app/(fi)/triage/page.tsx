import { getDb, listTriageQueue, searchRequests } from "@repo/fi";
import type { TriageQueueSort } from "@repo/fi";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardHeader, CardTitle } from "@repo/ui/components/card";
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
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort: sortParam } = await searchParams;
  const sort: TriageQueueSort =
    sortParam === "newest" || sortParam === "oldest" ? sortParam : "support";

  const db = getDb();
  const queue = await listTriageQueue({ db, sort });
  const { items: mergeTargets } = await searchRequests({
    db,
    pageSize: 100,
    sort: "title",
  });

  let sortLabel = "support";
  if (sort === "newest") sortLabel = "newest first";
  else if (sort === "oldest") sortLabel = "oldest first";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            PM triage queue
          </h1>
          <p className="text-muted-foreground text-sm">
            {queue.length} items · sorted by {sortLabel}
          </p>
        </div>
        <form action="/triage" className="flex gap-2" method="get">
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
              No open items need PM review right now.
            </EmptyDescription>
          </EmptyHeader>
          <Link className="text-primary text-sm underline" href="/insights">
            View Insights metrics
          </Link>
        </Empty>
      ) : null}
      <ul className="space-y-4">
        {queue.map((row) => {
          const steps = row.triageSteps as { needs_ai_review?: boolean } | null;
          const needsReview = steps?.needs_ai_review === true;
          return (
            <li key={row.id}>
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg">{row.title}</CardTitle>
                    {needsReview ? (
                      <Badge variant="outline">Needs AI / manual review</Badge>
                    ) : null}
                    <Badge variant="secondary">
                      {row.supportCount ?? 0} supporters
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {row.decisionBrief}
                  </p>
                  <TriagePanel
                    brief={row.decisionBrief}
                    mergeTargets={mergeTargets.map((t) => ({
                      id: t.id,
                      title: t.title,
                    }))}
                    requestId={row.id}
                  />
                </CardHeader>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
