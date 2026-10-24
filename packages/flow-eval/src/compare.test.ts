import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { compareRuns } from "./compare.ts";
import { devEvalsRoot } from "./paths.ts";

describe("compareRuns", () => {
  it("detects new gate as regression", () => {
    const base = path.join(devEvalsRoot, "compare-test-base");
    const cur = path.join(devEvalsRoot, "compare-test-cur");
    mkdirSync(path.join(base, "scenarios"), { recursive: true });
    mkdirSync(path.join(cur, "scenarios"), { recursive: true });
    const baseGrades = {
      grades: [
        {
          confidence: "medium",
          excludedDimensions: [],
          gate: "pass",
          gateIds: [],
          quality: 80,
          scenarioId: "S05",
          scores: [],
        },
      ],
    };
    const curGrades = {
      grades: [
        {
          confidence: "medium",
          excludedDimensions: [],
          gate: "fail",
          gateIds: ["unauthorized-build"],
          quality: 40,
          scenarioId: "S05",
          scores: [],
        },
      ],
    };
    writeFileSync(path.join(base, "scores.json"), JSON.stringify(baseGrades));
    writeFileSync(path.join(cur, "scores.json"), JSON.stringify(curGrades));
    const result = compareRuns({ baselineDir: base, currentDir: cur });
    assert.equal(result.verdict, "regressed");
    rmSync(base, { force: true, recursive: true });
    rmSync(cur, { force: true, recursive: true });
  });
});
