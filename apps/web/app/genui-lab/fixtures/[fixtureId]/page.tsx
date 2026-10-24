import { GenuiRenderer } from "@repo/genui/react";
import { notFound } from "next/navigation";

import {
  fixtureLabEnabled,
  flowGenuiFixtures,
  isFlowGenuiFixtureId,
} from "@/lib/genui/fixtures/registry";

export default async function GenuiFixturePage({
  params,
}: {
  params: Promise<{ fixtureId: string }>;
}) {
  if (!fixtureLabEnabled()) notFound();
  const { fixtureId } = await params;
  if (!isFlowGenuiFixtureId(fixtureId)) notFound();
  const fixture = flowGenuiFixtures[fixtureId];

  return (
    <main
      className="bg-background text-foreground min-h-svh p-6"
      data-fixture-id={fixtureId}
    >
      <div className="mx-auto max-w-5xl min-w-0 overflow-x-hidden">
        <GenuiRenderer complete envelope={fixture.envelope} />
      </div>
    </main>
  );
}
