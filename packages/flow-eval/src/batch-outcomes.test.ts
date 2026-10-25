import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { summarizeBatchOutcomes } from "./batch-outcomes.ts";
import type { GradeResult } from "./types.ts";

const baseGrade = (overrides: Partial<GradeResult> = {}): GradeResult => ({
  blockers: [],
  completeness: "complete",
  confidence: "high",
  excludedDimensions: [],
  gate: "pass",
  gateIds: [],
  officialEligible: true,
  quality: 80,
  scenarioId: "S09",
  scores: [],
  unverifiedDimensions: [],
  ...overrides,
});

describe("summarizeBatchOutcomes", () => {
  it("fails overall when infrastructure succeeds but no grades exist", () => {
    const outcomes = summarizeBatchOutcomes({
      errors: [],
      grades: [],
      infrastructureFailure: false,
      official: true,
      repetition: 1,
      scenarioIds: ["GEN-test"],
    });
    assert.equal(outcomes.infrastructure, "pass");
    assert.equal(outcomes.session, "fail");
    assert.equal(outcomes.overall, "fail");
  });

  it("fails product acceptance when agent passes gates but product check fails", () => {
    const outcomes = summarizeBatchOutcomes({
      errors: [],
      grades: [
        baseGrade({
          productOutcomePassed: false,
          scenarioId: "S16",
        }),
      ],
      infrastructureFailure: false,
      official: true,
      repetition: 1,
      scenarioIds: ["S16"],
    });
    assert.equal(outcomes.productAcceptance, "fail");
    assert.equal(outcomes.overall, "fail");
  });
});
