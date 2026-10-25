import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runTriageHarness } from "./run-triage-harness";

describe("runTriageHarness", () => {
  it("returns lexical duplicate candidate for CSV-like submit", async () => {
    const result = await runTriageHarness({
      description: "export report data",
      published: [
        {
          description: "csv export",
          id: "00000000-0000-4000-8000-000000000001",
          title: "Export dashboards to CSV",
        },
      ],
      source: "customer",
      title: "csv dump",
    });

    assert.equal(
      result.duplicateCandidates[0]?.id,
      "00000000-0000-4000-8000-000000000001"
    );
    assert.equal(result.themeKey, "reporting_exports");
    assert.ok(result.triageSteps.duration_ms >= 0);
  });

  it("marks degraded when AI gateway key is absent", async () => {
    const prior = process.env.AI_GATEWAY_API_KEY;
    delete process.env.AI_GATEWAY_API_KEY;
    const result = await runTriageHarness({
      description: "need csv",
      published: [],
      source: "internal",
      title: "export",
    });
    if (prior !== undefined) process.env.AI_GATEWAY_API_KEY = prior;
    assert.equal(result.degraded, true);
    assert.ok(result.triageSteps.steps.some((s) => s.name === "synthesize"));
  });
});
