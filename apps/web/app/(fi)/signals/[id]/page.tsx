import type { TriageStepsPayload } from "@repo/fi";
import { FI_SIMULATED_PM_ACTOR, getDb, searchRequests } from "@repo/fi";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isFeatureRequestId } from "@/app/_lib/feature-request-id";

import { SignalStatusBadge } from "../../_components/signal-status";
import { actionGetRequest, actionSupportWithCookie } from "../../actions";
import { TransparencyPanel } from "../../requests/[id]/transparency-panel";

export default async function SignalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const { view } = await searchParams;
  if (!isFeatureRequestId(id)) notFound();
  const detail = await actionGetRequest({ requestId: id });
  const externalView = view === "external";
  if (!detail) notFound();

  const triageSteps = detail.request.triageSteps as TriageStepsPayload | null;
  const req = detail.request;

  const db = getDb();
  const related = req.themeKey
    ? await searchRequests({
        db,
        pageSize: 5,
        sort: "support",
        themeKey: req.themeKey,
      })
    : { items: [] };

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-muted-foreground text-xs">
        <Link className="hover:underline" href="/signals">
          Feedback
        </Link>
        {req.themeLabel ? (
          <>
            {" / "}
            <Link
              className="hover:underline"
              href={`/signals?theme=${req.themeKey}`}
            >
              {req.themeLabel}
            </Link>
          </>
        ) : null}
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-lg font-semibold tracking-tight">{req.title}</h1>
          <div className="flex flex-wrap gap-2">
            {req.themeLabel ? (
              <span className="border-primary/30 bg-primary/5 text-primary rounded-md border px-2 py-0.5 text-xs">
                {req.themeLabel}
              </span>
            ) : null}
            <SignalStatusBadge disposition={req.disposition} />
          </div>
        </div>
        <form
          action={async () => {
            "use server";
            await actionSupportWithCookie({ requestId: id });
          }}
        >
          <Button size="sm" type="submit" variant="outline">
            {externalView ? "Add support" : "Support feedback"}
          </Button>
        </form>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Problem</h2>
            <p className="text-sm leading-relaxed">
              {req.problemStatement ?? req.description}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Customer evidence</h2>
            <blockquote className="border-primary/40 border-l-2 pl-4 text-sm italic">
              {req.description}
            </blockquote>
            <p className="text-muted-foreground text-xs">
              Source: {req.source.replaceAll("_", " ")}
            </p>
          </section>

          {req.decisionBrief ? (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold">Desired outcome</h2>
              <p className="text-sm leading-relaxed">{req.decisionBrief}</p>
            </section>
          ) : null}

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Related feedback</h2>
            <ul className="divide-border divide-y text-sm">
              {related.items
                .filter((r) => r.id !== id)
                .slice(0, 4)
                .map((r) => (
                  <li
                    className="flex items-center justify-between gap-2 py-2"
                    key={r.id}
                  >
                    <Link
                      className="text-primary hover:underline"
                      href={`/signals/${r.id}`}
                    >
                      {r.title}
                    </Link>
                    <SignalStatusBadge disposition={r.disposition} />
                  </li>
                ))}
            </ul>
          </section>

          <TransparencyPanel triageSteps={triageSteps} />
        </div>

        <aside className="border-border space-y-4 border-t pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Supporting accounts
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {detail.supportCount}
            </p>
          </div>
          {req.publishedAt ? (
            <div>
              <p className="text-muted-foreground text-xs tracking-wide uppercase">
                First seen
              </p>
              <p className="mt-1 text-sm">
                {req.publishedAt.toLocaleDateString()}
              </p>
            </div>
          ) : null}
          {req.disposition ? (
            <section className="border-border space-y-2 border-t pt-4">
              <h2 className="text-sm font-semibold">Decision history</h2>
              <SignalStatusBadge disposition={req.disposition} />
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
                  href={`/signals/${req.mergeTargetId}`}
                >
                  View canonical signal
                </Link>
              ) : null}
            </section>
          ) : (
            <p className="text-muted-foreground text-sm">
              No recorded decision yet.{" "}
              <Link className="text-primary underline" href="/review">
                Triage queue
              </Link>
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
