import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ThemeKey } from "../theme/registry";

const synthesisInput = {
  candidateSnippets: [] as { id: string; score: number; title: string }[],
  description: "Need better exports",
  isSolutionShaped: false,
  linkDuplicateId: null,
  source: "internal",
  themeKey: "reporting_exports" as ThemeKey,
  title: "CSV export",
};

describe("synthesizeArtifact", () => {
  it("returns degraded synthesis when no model is configured", async () => {
    const priorKey = process.env.AI_GATEWAY_API_KEY;
    delete process.env.AI_GATEWAY_API_KEY;

    const { synthesizeArtifact } = await import("./synthesize-artifact");
    const result = await synthesizeArtifact(synthesisInput);

    if (priorKey !== undefined) process.env.AI_GATEWAY_API_KEY = priorKey;

    assert.equal(
      result.decisionBrief,
      "Manual review recommended (degraded synthesis)."
    );
    assert.equal(result.dispositionSuggestion, null);
    assert.equal(result.duplicateExplanations.length, 0);
    assert.ok(result.problemStatement.includes("exports"));
  });
});

describe("isDegradedSynthesisBrief", () => {
  it("recognizes degraded synthesis brief strings", async () => {
    const { isDegradedSynthesisBrief } = await import("./synthesize-artifact");
    assert.equal(
      isDegradedSynthesisBrief(
        "Manual review recommended (degraded synthesis)."
      ),
      true
    );
    assert.equal(
      isDegradedSynthesisBrief(
        "Manual review recommended (synthesis model failed; degraded fallback)."
      ),
      true
    );
    assert.equal(isDegradedSynthesisBrief("Ship with confidence."), false);
  });
});
