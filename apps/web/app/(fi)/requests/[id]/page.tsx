import type { TriageStepsPayload } from "@repo/fi";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { notFound } from "next/navigation";

import { actionGetRequest, actionSupportWithCookie } from "../../actions";
import { TransparencyPanel } from "./transparency-panel";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await actionGetRequest({ requestId: id });
  if (!detail) notFound();

  const triageSteps = detail.request.triageSteps as TriageStepsPayload | null;

  return (
    <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <h1 className="font-heading text-2xl font-semibold">
          {detail.request.title}
        </h1>
        <p className="text-muted-foreground">
          {detail.request.problemStatement}
        </p>
        <p>{detail.request.description}</p>
        <p className="text-sm">{detail.request.decisionBrief}</p>
        <TransparencyPanel triageSteps={triageSteps} />
      </div>
      <aside className="border-border space-y-4 rounded-lg border p-4">
        <div className="flex flex-wrap gap-2">
          {detail.request.themeLabel ? (
            <Badge>{detail.request.themeLabel}</Badge>
          ) : null}
          <Badge variant="outline">{detail.request.source}</Badge>
        </div>
        <p className="text-sm">Support count: {detail.supportCount}</p>
        <form
          action={async () => {
            "use server";
            await actionSupportWithCookie({ requestId: id });
          }}
        >
          <Button type="submit" variant="secondary">
            Support
          </Button>
        </form>
      </aside>
    </div>
  );
}
