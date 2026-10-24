import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FeatureTriagePanel } from "@/app/_components/feature-triage-panel";
import {
  confirmFeatureTriage,
  supportFeatureRequest,
} from "@/app/_lib/features/actions";
import { getRequest, listRequests } from "@/app/_lib/features/repository";

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await getRequest({ id });
  if (!request) notFound();

  const catalog = await listRequests();
  const related = catalog.filter(
    (item) => request.triage?.relatedIds.includes(item.id) && item.id !== id
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-medium">{request.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{request.status}</Badge>
          <Badge variant="secondary">{request.theme}</Badge>
          <Badge variant="outline">{request.supportCount} supporters</Badge>
        </div>
        <p className="text-sm leading-relaxed">{request.description}</p>
      </div>

      <form action={supportFeatureRequest}>
        <input name="id" type="hidden" value={request.id} />
        <Button type="submit" variant="secondary">
          Support this request
        </Button>
      </form>

      <FeatureTriagePanel
        initialTriage={request.triage}
        requestId={request.id}
      />

      {request.triage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suggested triage</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p>
              <span className="text-muted-foreground">Theme:</span>{" "}
              {request.triage.suggestedTheme}
            </p>
            <p>
              <span className="text-muted-foreground">Priority:</span>{" "}
              {request.triage.priority}
            </p>
            <p className="leading-relaxed">{request.triage.rationale}</p>
            <p className="text-muted-foreground text-xs">
              Source:{" "}
              {request.triage.mode === "ai" ? "AI model" : "Fixture mode"}
              {request.triage.confirmedAt
                ? ` · Confirmed ${new Date(request.triage.confirmedAt).toLocaleString()}`
                : ""}
            </p>
            {!request.triage.confirmedAt && (
              <form action={confirmFeatureTriage}>
                <input name="id" type="hidden" value={request.id} />
                <Button type="submit">Confirm triage</Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {related.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Related requests</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {related.map((item) => (
              <li key={item.id}>
                <Link className="underline" href={`/features/${item.id}`}>
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
