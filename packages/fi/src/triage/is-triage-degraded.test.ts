import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isTriageDegraded } from "./is-triage-degraded";

describe("isTriageDegraded", () => {
  it("returns true when degraded or needs_ai_review", () => {
    assert.equal(isTriageDegraded({ degraded: true, steps: [] }), true);
    assert.equal(
      isTriageDegraded({ degraded: false, needs_ai_review: true, steps: [] }),
      true
    );
    assert.equal(isTriageDegraded({ degraded: false, steps: [] }), false);
    assert.equal(isTriageDegraded(null), false);
  });
});
