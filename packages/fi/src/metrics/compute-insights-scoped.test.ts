import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { computeInsightsScoped } from "./compute-insights-scoped";

const computedAt = new Date("2026-10-26T12:00:00.000Z");
const fromIso = "2026-09-26T12:00:00.000Z";

const triageSteps = ({ degraded }: { degraded?: boolean }) => ({
  degraded,
  duration_ms: 1,
  model: "test",
  steps: [],
  version: 1,
});

describe("computeInsightsScoped", () => {
  it("counts decisions in range by disposition_at, not snapshot", () => {
    const result = computeInsightsScoped({
      computedAt,
      fromIso,
      rows: [
        {
          disposition: "monitor",
          dispositionAt: new Date("2026-10-01T00:00:00Z"),
          dispositionRationale: "ok",
          intakeLinkedRequestId: null,
          pmReviewStartedAt: new Date("2026-10-01T00:00:00Z"),
          publishedAt: new Date("2026-09-01T00:00:00Z"),
          status: "published",
          submittedAt: new Date("2026-09-01T00:00:00Z"),
          triageCompletedAt: new Date("2026-09-01T00:01:00Z"),
          triageSteps: triageSteps({ degraded: false }),
        },
        {
          disposition: "decline",
          dispositionAt: new Date("2026-01-01T00:00:00Z"),
          dispositionRationale: "old",
          intakeLinkedRequestId: null,
          pmReviewStartedAt: new Date("2026-01-01T00:00:00Z"),
          publishedAt: new Date("2026-01-01T00:00:00Z"),
          status: "published",
          submittedAt: new Date("2026-01-01T00:00:00Z"),
          triageCompletedAt: new Date("2026-01-01T00:01:00Z"),
          triageSteps: null,
        },
      ],
    });

    assert.equal(result.sample.decisionsInRangeCount, 1);
    assert.equal(result.sample.dispositionWithRationaleCount, 2);
  });

  it("tracks readinessDegradedN in period numerator", () => {
    const result = computeInsightsScoped({
      computedAt,
      fromIso,
      rows: [
        {
          disposition: null,
          dispositionAt: null,
          dispositionRationale: null,
          intakeLinkedRequestId: null,
          pmReviewStartedAt: null,
          publishedAt: new Date("2026-10-01T00:00:00Z"),
          status: "published",
          submittedAt: new Date("2026-10-01T00:00:00Z"),
          triageCompletedAt: new Date("2026-10-01T00:05:00Z"),
          triageSteps: triageSteps({ degraded: true }),
        },
        {
          disposition: null,
          dispositionAt: null,
          dispositionRationale: null,
          intakeLinkedRequestId: null,
          pmReviewStartedAt: null,
          publishedAt: new Date("2026-10-02T00:00:00Z"),
          status: "published",
          submittedAt: new Date("2026-10-02T00:00:00Z"),
          triageCompletedAt: new Date("2026-10-02T00:05:00Z"),
          triageSteps: triageSteps({ degraded: false }),
        },
      ],
    });

    assert.equal(result.sample.readinessN, 2);
    assert.equal(result.sample.readinessDegradedN, 1);
  });
});
