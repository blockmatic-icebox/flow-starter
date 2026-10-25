import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { classifyThemeDeterministic } from "./classify-deterministic";

describe("classifyThemeDeterministic", () => {
  it("classifies CSV export with high confidence", () => {
    const result = classifyThemeDeterministic({
      description: "Need csv dump of analytics",
      title: "Export dashboards to CSV",
    });
    assert.equal(result.themeKey, "reporting_exports");
    assert.ok(result.confidence >= 0.9);
    assert.equal(result.skippedJev, true);
  });

  it("returns platform_other with low confidence for vague text", () => {
    const result = classifyThemeDeterministic({
      description: "Make it better",
      title: "Improve product",
    });
    assert.equal(result.themeKey, "platform_other");
    assert.ok(result.confidence < 0.9);
    assert.equal(result.skippedJev, false);
  });
});
