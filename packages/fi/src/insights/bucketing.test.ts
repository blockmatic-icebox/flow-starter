import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { countOpenQueueAt, weekStartsBetween } from "./bucketing";

describe("bucketing", () => {
  it("reconstructs open queue at a point in time", () => {
    const when = new Date("2026-10-20T12:00:00.000Z");
    const count = countOpenQueueAt({
      rows: [
        {
          disposition: null,
          dispositionAt: null,
          dispositionRationale: null,
          intakeLinkedRequestId: null,
          pmReviewStartedAt: null,
          publishedAt: new Date("2026-10-01T00:00:00.000Z"),
          status: "published",
          submittedAt: new Date("2026-10-01T00:00:00.000Z"),
          triageCompletedAt: new Date("2026-10-01T00:00:00.000Z"),
        },
        {
          disposition: "monitor",
          dispositionAt: new Date("2026-10-25T00:00:00.000Z"),
          dispositionRationale: "wait",
          intakeLinkedRequestId: null,
          pmReviewStartedAt: null,
          publishedAt: new Date("2026-10-01T00:00:00.000Z"),
          status: "published",
          submittedAt: new Date("2026-10-01T00:00:00.000Z"),
          triageCompletedAt: new Date("2026-10-01T00:00:00.000Z"),
        },
      ],
      when,
    });
    assert.equal(count, 2);
  });

  it("emits UTC week starts", () => {
    const weeks = weekStartsBetween({
      from: new Date("2026-10-01T00:00:00.000Z"),
      to: new Date("2026-10-20T00:00:00.000Z"),
    });
    assert.ok(weeks.length >= 2);
    assert.equal(weeks[0]?.getUTCDay(), 1);
  });
});
