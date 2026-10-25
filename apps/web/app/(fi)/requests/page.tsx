import { Badge } from "@repo/ui/components/badge";
import { Card, CardHeader, CardTitle } from "@repo/ui/components/card";
import Link from "next/link";

import { actionSearchRequests } from "../actions";

export default async function RequestsPage() {
  const rows = await actionSearchRequests({});

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Discover requests</h1>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.id}>
            <Card>
              <CardHeader className="gap-2">
                <Link
                  className="font-medium hover:underline"
                  href={`/requests/${row.id}`}
                >
                  <CardTitle className="text-lg">{row.title}</CardTitle>
                </Link>
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  {row.problemStatement ?? row.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {row.themeLabel ? (
                    <Badge variant="outline">{row.themeLabel}</Badge>
                  ) : null}
                  <Badge variant="secondary">{row.source}</Badge>
                </div>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
