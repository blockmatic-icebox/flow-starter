import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { trialScenarioDir } from "./trial-paths.ts";

describe("trial paths", () => {
  it("uses distinct repetition directories", () => {
    const a = trialScenarioDir({
      repetition: 1,
      runId: "run-1",
      scenarioId: "S01",
    });
    const b = trialScenarioDir({
      repetition: 2,
      runId: "run-1",
      scenarioId: "S01",
    });
    assert.notEqual(a, b);
    assert.match(a, /r1$/u);
    assert.match(b, /r2$/u);
  });
});
