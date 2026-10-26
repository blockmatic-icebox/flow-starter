import { computeInsightsScoped } from "@repo/fi";
import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";

export default defineEval({
  description:
    "Scoped insights count decisions by disposition_at in range, not all-time snapshot.",
  tags: ["smoke"],
  async test(t) {
    const computedAt = new Date("2026-10-26T12:00:00.000Z");
    const fromIso = "2026-09-26T12:00:00.000Z";
    const result = computeInsightsScoped({
      computedAt,
      fromIso,
      rows: [
        {
          disposition: "monitor",
          dispositionAt: new Date("2026-10-01T00:00:00Z"),
          dispositionRationale: "ok",
          intakeLinkedRequestId: null,
          pmReviewStartedAt: new Date(),
          publishedAt: new Date("2026-09-01T00:00:00Z"),
          status: "published",
          submittedAt: new Date("2026-09-01T00:00:00Z"),
          triageCompletedAt: new Date("2026-09-01T00:01:00Z"),
          triageSteps: null,
        },
        {
          disposition: "decline",
          dispositionAt: new Date("2026-01-01T00:00:00Z"),
          dispositionRationale: "old",
          intakeLinkedRequestId: null,
          pmReviewStartedAt: new Date(),
          publishedAt: new Date("2026-01-01T00:00:00Z"),
          status: "published",
          submittedAt: new Date("2026-01-01T00:00:00Z"),
          triageCompletedAt: new Date("2026-01-01T00:01:00Z"),
          triageSteps: null,
        },
      ],
    });

    await t.require(result.sample.decisionsInRangeCount, equals(1));
    await t.require(result.sample.dispositionWithRationaleCount, equals(2));
    t.succeeded();
  },
});
