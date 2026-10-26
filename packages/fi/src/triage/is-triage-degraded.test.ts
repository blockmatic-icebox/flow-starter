import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isTriageDegraded } from "./is-triage-degraded";

const triageSteps = ({
  degraded,
  needs_ai_review,
}: {
  degraded?: boolean;
  needs_ai_review?: boolean;
}) => ({
  degraded,
  duration_ms: 1,
  model: "test",
  needs_ai_review,
  steps: [],
  version: 1,
});

describe("isTriageDegraded", () => {
  it("returns true when degraded or needs_ai_review", () => {
    assert.equal(isTriageDegraded(triageSteps({ degraded: true })), true);
    assert.equal(
      isTriageDegraded(triageSteps({ degraded: false, needs_ai_review: true })),
      true
    );
    assert.equal(isTriageDegraded(triageSteps({ degraded: false })), false);
    assert.equal(isTriageDegraded(null), false);
  });
});
