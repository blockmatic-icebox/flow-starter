import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { inRange, resolveInsightsRange } from "./insights-range";

describe("insights range", () => {
  it("resolves 90d window", () => {
    const computedAt = new Date("2026-10-25T12:00:00.000Z");
    const range = resolveInsightsRange({ computedAt, preset: "90d" });
    assert.equal(range.preset, "90d");
    assert.ok(range.from);
  });

  it("filters dates in range", () => {
    const to = new Date("2026-10-25T12:00:00.000Z");
    const from = new Date("2026-10-01T00:00:00.000Z");
    assert.equal(
      inRange({
        date: new Date("2026-10-15T00:00:00.000Z"),
        from,
        to,
      }),
      true
    );
    assert.equal(
      inRange({
        date: new Date("2025-01-01T00:00:00.000Z"),
        from,
        to,
      }),
      false
    );
  });
});
