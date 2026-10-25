import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deriveHostFinalizationOutcome } from "./finalization-outcome.ts";
import type { GradeResult, HostJobStatus } from "./types.ts";

const grade = ({
  gate = "pass" as const,
  officialEligible = false,
  scenarioId = "S01",
}: {
  gate?: "pass" | "fail";
  officialEligible?: boolean;
  scenarioId?: string;
}): GradeResult =>
  ({
    gate,
    officialEligible,
    scenarioId,
  }) as GradeResult;

const job = (status: HostJobStatus) => ({ status });

describe("deriveHostFinalizationOutcome", () => {
  it("zero scheduled jobs is blocked", () => {
    const result = deriveHostFinalizationOutcome({
      expectedGrades: 0,
      grades: [],
      incompleteJobLabels: [],
      jobs: [],
    });
    assert.equal(result.outcome, "blocked");
    assert.equal(result.ok, false);
  });

  it("all jobs blocked with no grades is blocked", () => {
    const result = deriveHostFinalizationOutcome({
      expectedGrades: 2,
      grades: [],
      incompleteJobLabels: [],
      jobs: [job("blocked"), job("blocked")],
    });
    assert.equal(result.outcome, "blocked");
    assert.equal(result.ok, false);
  });

  it("all jobs failed with no grades is blocked", () => {
    const result = deriveHostFinalizationOutcome({
      expectedGrades: 1,
      grades: [],
      incompleteJobLabels: [],
      jobs: [job("failed")],
    });
    assert.equal(result.outcome, "blocked");
  });

  it("one complete and one blocked is partial", () => {
    const result = deriveHostFinalizationOutcome({
      expectedGrades: 2,
      grades: [grade({})],
      incompleteJobLabels: [],
      jobs: [job("complete"), job("blocked")],
    });
    assert.equal(result.outcome, "partial");
    assert.equal(result.ok, false);
  });

  it("one complete and one pending is partial", () => {
    const result = deriveHostFinalizationOutcome({
      expectedGrades: 2,
      grades: [grade({})],
      incompleteJobLabels: ["S02/r1:pending"],
      jobs: [job("complete"), job("pending")],
    });
    assert.equal(result.outcome, "partial");
  });

  it("all completed with passing gates is complete", () => {
    const result = deriveHostFinalizationOutcome({
      expectedGrades: 2,
      grades: [grade({}), grade({ scenarioId: "S02" })],
      incompleteJobLabels: [],
      jobs: [job("complete"), job("complete")],
    });
    assert.equal(result.outcome, "complete");
    assert.equal(result.ok, true);
  });

  it("graded gate failure is failed", () => {
    const result = deriveHostFinalizationOutcome({
      expectedGrades: 1,
      grades: [grade({ gate: "fail" })],
      incompleteJobLabels: [],
      jobs: [job("complete")],
    });
    assert.equal(result.outcome, "failed");
    assert.equal(result.ok, false);
  });

  it("complete diagnostic grades with officialEligible false still complete", () => {
    const result = deriveHostFinalizationOutcome({
      expectedGrades: 1,
      grades: [grade({ officialEligible: false })],
      incompleteJobLabels: [],
      jobs: [job("complete")],
    });
    assert.equal(result.outcome, "complete");
    assert.equal(result.ok, true);
  });
});
