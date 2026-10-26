import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { classifyThemeDeterministic } from "./classify-deterministic";

describe("classifyThemeDeterministic", () => {
  it("classifies Spanish shift-change alert text as notifications", () => {
    const result = classifyThemeDeterministic({
      description:
        "No me llegan los cambios de turno. Mi supervisor cambió mi horario, pero no recibí aviso.",
      title: "No me llegan los cambios de turno",
    });
    assert.equal(result.themeKey, "notifications");
    assert.ok(result.confidence >= 0.9);
    assert.equal(result.skippedJev, true);
  });

  it("classifies sick-call coverage with high confidence", () => {
    const result = classifyThemeDeterministic({
      description:
        "Open shift coverage when a cook calls out sick — need replacement staffing.",
      title: "Who can cover a sick call on short notice?",
    });
    assert.equal(result.themeKey, "scheduling_coverage");
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
