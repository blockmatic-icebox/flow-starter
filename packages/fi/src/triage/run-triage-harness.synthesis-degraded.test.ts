import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";

const degradedBrief = "Manual review recommended (degraded synthesis).";

mock.module("./classify-decisions.ts", {
  exports: {
    classifyDecisions: () =>
      Promise.resolve({
        degraded: false,
        isSolutionShaped: false,
        linkDuplicateId: null,
        themeKey: "shift_swaps",
        themeSkippedJev: true,
      }),
  },
});

mock.module("./synthesize-artifact.ts", {
  exports: {
    isDegradedSynthesisBrief: (decisionBrief: string) =>
      decisionBrief === degradedBrief,
    synthesizeArtifact: () =>
      Promise.resolve({
        decisionBrief: degradedBrief,
        dispositionSuggestion: null,
        duplicateExplanations: [],
        problemStatement: "Export pain",
        themeRationale: "Theme from routing.",
      }),
  },
});

const { runTriageHarness } = await import("./run-triage-harness");

describe("runTriageHarness degraded synthesis brief", () => {
  it("marks degraded when synthesis returns a degraded brief", async () => {
    const priorKey = process.env.AI_GATEWAY_API_KEY;
    process.env.AI_GATEWAY_API_KEY = "test-gateway-key";

    const result = await runTriageHarness({
      description: "export report data",
      published: [],
      source: "customer",
      title: "csv dump",
    });

    if (priorKey === undefined) delete process.env.AI_GATEWAY_API_KEY;
    else process.env.AI_GATEWAY_API_KEY = priorKey;

    assert.equal(result.degraded, true);
    assert.equal(result.decisionBrief, degradedBrief);
    assert.equal(result.triageSteps.degraded, true);
  });
});
