import { Badge } from "@repo/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import Link from "next/link";

import { listRequests } from "@/app/_lib/features/repository";

export default async function FeaturesPage() {
  const requests = await listRequests();

  const byTheme: Record<string, number> = {};
  for (const request of requests)
    byTheme[request.theme] = (byTheme[request.theme] ?? 0) + 1;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h1 className="text-xl font-medium">Discover requests</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Requests are grouped by <strong>theme</strong> after triage. Support
          counts signal demand; product owners confirm AI triage before items
          enter the prioritized backlog.
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(byTheme).map(([theme, count]) => (
            <Badge key={theme} variant="secondary">
              {theme} · {count}
            </Badge>
          ))}
        </div>
      </section>

      {requests.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No requests yet.{" "}
          <Link className="underline" href="/features/new">
            Submit the first one
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((request) => (
            <li key={request.id}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    <Link
                      className="hover:underline"
                      href={`/features/${request.id}`}
                    >
                      {request.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                  <p className="text-muted-foreground line-clamp-2">
                    {request.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{request.status}</Badge>
                    <Badge variant="secondary">{request.theme}</Badge>
                    <Badge variant="outline">
                      {request.supportCount} supporters
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
