import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { computeInsights } from "./compute-insights.js";

describe("computeInsights", () => {
  it("computes capture rate as closed / (closed + open queue)", () => {
    const result = computeInsights({
      rows: [
        {
          disposition: "monitor",
          dispositionAt: new Date("2026-01-01T00:02:00Z"),
          dispositionRationale: "watch",
          intakeLinkedRequestId: null,
          pmReviewStartedAt: new Date("2026-01-01T00:01:00Z"),
          publishedAt: new Date("2026-01-01T00:00:02Z"),
          status: "published",
          submittedAt: new Date("2026-01-01T00:00:00Z"),
          triageCompletedAt: new Date("2026-01-01T00:00:01Z"),
        },
        {
          disposition: "decline",
          dispositionAt: new Date("2026-01-01T00:03:00Z"),
          dispositionRationale: "no",
          intakeLinkedRequestId: null,
          pmReviewStartedAt: new Date("2026-01-01T00:01:00Z"),
          publishedAt: new Date("2026-01-01T00:00:02Z"),
          status: "published",
          submittedAt: new Date("2026-01-01T00:00:00Z"),
          triageCompletedAt: new Date("2026-01-01T00:00:01Z"),
        },
        ...Array.from({ length: 7 }, () => ({
          disposition: null,
          dispositionAt: null,
          dispositionRationale: null,
          intakeLinkedRequestId: null,
          pmReviewStartedAt: null,
          publishedAt: new Date("2026-01-01T00:00:02Z"),
          status: "published" as const,
          submittedAt: new Date("2026-01-01T00:00:00Z"),
          triageCompletedAt: new Date("2026-01-01T00:00:01Z"),
        })),
      ],
    });

    assert.equal(result.openQueueCount, 7);
    assert.equal(result.sample.dispositionWithRationaleCount, 2);
    assert.equal(result.decisionCaptureRate, 2 / 9);
    assert.equal(result.sample.openQueueCount, 7);
  });

  it("computes intake link rate over published rows", () => {
    const result = computeInsights({
      rows: [
        {
          disposition: null,
          dispositionAt: null,
          dispositionRationale: null,
          intakeLinkedRequestId: "00000000-0000-4000-8000-000000000001",
          pmReviewStartedAt: null,
          publishedAt: new Date(),
          status: "published",
          submittedAt: new Date(),
          triageCompletedAt: new Date(),
        },
        {
          disposition: null,
          dispositionAt: null,
          dispositionRationale: null,
          intakeLinkedRequestId: null,
          pmReviewStartedAt: null,
          publishedAt: new Date(),
          status: "published",
          submittedAt: new Date(),
          triageCompletedAt: new Date(),
        },
      ],
    });

    assert.equal(result.intakeLinkRate, 0.5);
    assert.equal(result.sample.intakeLinkCount, 1);
  });
});
