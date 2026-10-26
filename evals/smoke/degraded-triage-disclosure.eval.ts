import { createDraftAndTriage, getDb, loadRootEnv } from "@repo/fi";
import { defineEval } from "eve/evals";
import { equals, satisfies } from "eve/evals/expect";

export default defineEval({
  description:
    "Isolated submit exposes harness.degraded and triage_steps when AI gateway is off.",
  tags: ["smoke"],
  async test(t) {
    loadRootEnv();
    if (!process.env.DATABASE_URL?.trim())
      t.skip("DATABASE_URL not set; degraded triage requires seeded DB");

    if (process.env.AI_GATEWAY_API_KEY?.trim())
      t.skip(
        "AI_GATEWAY_API_KEY is set; unset gateway in CI to assert degraded triage disclosure (see @repo/fi run-triage-harness.test.ts)"
      );

    const db = getDb();
    const title = `Eval degraded ${crypto.randomUUID().slice(0, 8)}`;
    const { harness, request } = await createDraftAndTriage({
      db,
      description: "Eval-only draft for degraded disclosure check.",
      source: "internal",
      title,
    });

    await t.require(harness.degraded, equals(true));
    await t.require(harness.triageSteps.degraded, equals(true));
    await t.require(
      harness.triageSteps.steps.length,
      satisfies((n) => n > 0, "triage_steps.steps")
    );
    const persisted = request?.triageSteps as
      | { degraded?: boolean; steps?: unknown[] }
      | null
      | undefined;
    await t.require(persisted?.degraded, equals(true));
    await t.require(
      persisted?.steps?.length ?? 0,
      satisfies((n) => n > 0, "persisted triage_steps")
    );
    t.succeeded();
  },
});
