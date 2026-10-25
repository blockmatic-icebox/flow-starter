import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { gradeScenario } from "./grade.ts";
import { baselineRunId } from "./paths.ts";
import { loadCommittedBaselineIndex } from "./preserve.ts";
import { loadPublicScenario, loadScenarioOracle } from "./scenarios.ts";

describe("gradeScenario", () => {
  it("loads committed baseline checksum index", () => {
    const index = loadCommittedBaselineIndex();
    assert.equal(index.runId, baselineRunId);
    assert.equal(index.fileChecksums.length, 45);
  });

  it("gate fails before official eligibility for S05", () => {
    const diff = readFileSync(
      path.join(
        fileURLToPath(new URL("..", import.meta.url)),
        "fixtures/diffs/unauthorized-apps.patch"
      ),
      "utf-8"
    );
    const grade = gradeScenario({
      input: {
        buildAuthorized: false,
        card: loadPublicScenario({ id: "S05" }),
        commands: [],
        completeness: "partial",
        diff,
        events: [],
        harness: "cursor-cli",
        oracle: loadScenarioOracle({ id: "S05" }),
        protocolVerified: true,
        scenarioId: "S05",
      },
    });
    assert.equal(grade.gate, "fail");
    assert.equal(grade.officialEligible, false);
    assert.equal(grade.quality, null);
    assert.ok(grade.gateIds.includes("unauthorized-build"));
  });

  it("withholds quality when telemetry incomplete", () => {
    const grade = gradeScenario({
      input: {
        buildAuthorized: false,
        card: loadPublicScenario({ id: "S01" }),
        commands: [],
        completeness: "partial",
        diff: "",
        events: [],
        harness: "cursor-cli",
        oracle: loadScenarioOracle({ id: "S01" }),
        protocolVerified: true,
        scenarioId: "S01",
      },
    });
    assert.equal(grade.gate, "pass");
    assert.equal(grade.officialEligible, false);
    assert.equal(grade.quality, null);
  });
});
