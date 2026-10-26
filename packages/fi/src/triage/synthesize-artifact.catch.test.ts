import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";

import type { ThemeKey } from "../theme/registry";

mock.module("ai", {
  exports: {
    generateObject: () => {
      throw new Error("synthesis failed");
    },
  },
});

mock.module("../ai/gateway.ts", {
  exports: {
    getFiSynthesisModel: () => ({ modelId: "test-synthesis" }),
  },
});

const { synthesizeArtifact } = await import("./synthesize-artifact");

const synthesisInput = {
  candidateSnippets: [] as { id: string; score: number; title: string }[],
  description: "Need better exports",
  isSolutionShaped: false,
  linkDuplicateId: null,
  source: "internal",
  themeKey: "reporting_exports" as ThemeKey,
  title: "CSV export",
};

describe("synthesizeArtifact catch path", () => {
  it("returns degraded synthesis when generateObject fails", async () => {
    const priorKey = process.env.AI_GATEWAY_API_KEY;
    process.env.AI_GATEWAY_API_KEY = "test-gateway-key";

    const result = await synthesizeArtifact(synthesisInput);

    if (priorKey === undefined) delete process.env.AI_GATEWAY_API_KEY;
    else process.env.AI_GATEWAY_API_KEY = priorKey;

    assert.equal(
      result.decisionBrief,
      "Manual review recommended (synthesis model failed; degraded fallback)."
    );
  });
});
