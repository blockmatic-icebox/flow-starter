import type { TriageStepsPayload } from "@repo/fi";
import { FI_SIMULATED_PM_ACTOR } from "@repo/fi";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { notFound } from "next/navigation";

import { actionGetRequest, actionSupportWithCookie } from "../../actions";
import { TransparencyPanel } from "./transparency-panel";

export default async function RequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const { view } = await searchParams;
  const detail = await actionGetRequest({ requestId: id });
  const externalView = view === "external";
  if (!detail) notFound();

  const triageSteps = detail.request.triageSteps as TriageStepsPayload | null;
  const req = detail.request;

  return (
    <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <h1 className="font-heading text-2xl font-semibold">{req.title}</h1>
        <p className="text-muted-foreground">{req.problemStatement}</p>
        <p>{req.description}</p>
        <p className="text-sm">{req.decisionBrief}</p>
        <TransparencyPanel triageSteps={triageSteps} />
      </div>
      <aside className="border-border space-y-4 rounded-lg border p-4">
        <div className="flex flex-wrap gap-2">
          {req.themeLabel ? <Badge>{req.themeLabel}</Badge> : null}
          <Badge variant="outline">{req.source}</Badge>
        </div>
        <p className="text-sm">Support count: {detail.supportCount}</p>
        <form
          action={async () => {
            "use server";
            await actionSupportWithCookie({ requestId: id });
          }}
        >
          <Button type="submit" variant="secondary">
            {externalView ? "I want this too" : "Support"}
          </Button>
        </form>
        {req.disposition ? (
          <section className="space-y-2 border-t pt-4">
            <h2 className="text-sm font-semibold">Decision</h2>
            <Badge>{req.disposition.replace("_", " ")}</Badge>
            {req.dispositionRationale ? (
              <p className="text-sm">{req.dispositionRationale}</p>
            ) : null}
            {req.dispositionAt ? (
              <p className="text-muted-foreground text-xs">
                {req.dispositionAt.toLocaleString()} · {FI_SIMULATED_PM_ACTOR}
              </p>
            ) : null}
            {req.disposition === "merge" && req.mergeTargetId ? (
              <Link
                className="text-primary text-sm underline"
                href={`/requests/${req.mergeTargetId}`}
              >
                View canonical request
              </Link>
            ) : null}
            {req.status === "archived" && req.canonicalRequestId ? (
              <p className="text-muted-foreground text-xs">
                Merged into{" "}
                <Link
                  className="text-primary underline"
                  href={`/requests/${req.canonicalRequestId}`}
                >
                  canonical request
                </Link>
              </p>
            ) : null}
          </section>
        ) : null}
      </aside>
    </div>
  );
}
