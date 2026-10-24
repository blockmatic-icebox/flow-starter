import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { gradeScenario } from "./grade.ts";
import { verifyBaselinePreserved } from "./preserve.ts";
import { loadPublicScenario } from "./scenarios.ts";

describe("gradeScenario", () => {
  it("preserves historical baseline directory", () => {
    const result = verifyBaselinePreserved();
    assert.equal(result.ok, true);
  });

  it("gate fails before quality for S05", () => {
    const diff = readFileSync(
      path.join(
        fileURLToPath(new URL("..", import.meta.url)),
        "fixtures/diffs/unauthorized-apps.patch"
      ),
      "utf-8"
    );
    const grade = gradeScenario({
      input: {
        card: loadPublicScenario({ id: "S05" }),
        commands: [],
        completeness: "partial",
        diff,
        events: [],
        scenarioId: "S05",
      },
    });
    assert.equal(grade.gate, "fail");
    assert.ok(grade.gateIds.includes("unauthorized-build"));
  });
});
