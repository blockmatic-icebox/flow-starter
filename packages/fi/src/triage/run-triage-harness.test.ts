import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runTriageHarness } from "./run-triage-harness";

describe("runTriageHarness", () => {
  it("returns lexical duplicate candidate for paraphrased shift-swap submit", async () => {
    const canonicalId = "00000000-0000-4000-8000-000000008201";
    const result = await runTriageHarness({
      description:
        "We traded shifts and manager approved but schedules still show the old assignment.",
      published: [
        {
          description:
            "Marco agreed to cover Saturday and our manager approved it yesterday, but both of us still see the old schedule.",
          id: canonicalId,
          title: "My approved shift swap disappeared",
        },
      ],
      source: "customer",
      title: "Swap approved but schedule unchanged",
    });

    assert.equal(result.duplicateCandidates[0]?.id, canonicalId);
    assert.equal(result.themeKey, "shift_swaps");
    assert.ok(result.triageSteps.duration_ms >= 0);
  });

  it("marks degraded when AI gateway key is absent", async () => {
    const prior = process.env.AI_GATEWAY_API_KEY;
    delete process.env.AI_GATEWAY_API_KEY;
    const result = await runTriageHarness({
      description: "need manager approval before closing shift trade",
      published: [],
      source: "internal",
      title: "Swap approval for close",
    });
    if (prior !== undefined) process.env.AI_GATEWAY_API_KEY = prior;
    assert.equal(result.degraded, true);
    assert.ok(result.triageSteps.steps.some((s) => s.name === "synthesize"));
  });
});
