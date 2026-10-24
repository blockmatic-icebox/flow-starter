import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { composeQuery } from "./compose";

describe("composeQuery", () => {
  it("routes compare plans to tier 1", () => {
    const result = composeQuery({
      input: {
        clientRequestId: "t1",
        query: "Compare Orbit plan versus Nova plan",
        version: 1,
      },
    });
    assert.equal(result.metadata.tier, 1);
    assert.equal(result.metadata.validationOk, true);
    assert.equal(result.metadata.component, "ComparisonView");
  });

  it("composes tier 2 stack for compound prompts", () => {
    const result = composeQuery({
      input: {
        clientRequestId: "t2",
        query: "Explain the API and show revenue metrics",
        version: 1,
      },
    });
    assert.equal(result.metadata.tier, 2);
    assert.equal(result.metadata.validationOk, true);
  });
});
