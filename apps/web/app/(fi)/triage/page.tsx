import { getDb, listTriageQueue } from "@repo/fi";
import { Card, CardHeader, CardTitle } from "@repo/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@repo/ui/components/empty";
import Link from "next/link";

import { TriagePanel } from "./triage-panel";

export default async function TriagePage() {
  const queue = await listTriageQueue({ db: getDb() });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">PM triage queue</h1>
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
        {queue.map((row) => (
          <li key={row.id}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{row.title}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {row.decisionBrief}
                </p>
                <TriagePanel brief={row.decisionBrief} requestId={row.id} />
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
