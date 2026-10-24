import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { compareRuns } from "./compare.ts";
import { devEvalsRoot } from "./paths.ts";
import { rubricVersion } from "./rubric.ts";
import { PROTOCOL_ID } from "./trace.ts";

const manifest = (runId: string, sourceSha = "abc") => ({
  agentCliVersion: "2026.10.22",
  arm: "flow" as const,
  catalogHash: "x",
  completeness: "partial",
  cursorVersion: "unknown",
  flowSha: "abc",
  flowVersion: "0.2",
  harness: "cursor-cli",
  modelId: "composer-2.5",
  protocol: PROTOCOL_ID,
  rubricVersion,
  runId,
  sandboxEnabled: true,
  scenarioIds: ["S05"],
  sourceSha,
  trustEnabled: true,
});

describe("compareRuns", () => {
  it("allows sourceSha mismatch in remediation mode", () => {
    const base = path.join(devEvalsRoot, "compare-rem-base");
    const cur = path.join(devEvalsRoot, "compare-rem-cur");
    mkdirSync(base, { recursive: true });
    mkdirSync(cur, { recursive: true });
    const grades = {
      grades: [
        {
          blockers: [],
          completeness: "complete",
          confidence: "high",
          excludedDimensions: [],
          gate: "pass",
          gateIds: [],
          officialEligible: true,
          quality: 80,
          scenarioId: "S05",
          scores: [],
          unverifiedDimensions: [],
        },
      ],
    };
    writeFileSync(path.join(base, "scores.json"), JSON.stringify(grades));
    writeFileSync(path.join(cur, "scores.json"), JSON.stringify(grades));
    writeFileSync(
      path.join(base, "manifest.json"),
      JSON.stringify({ ...manifest("compare-rem-base"), sourceSha: "aaa1111" })
    );
    writeFileSync(
      path.join(cur, "manifest.json"),
      JSON.stringify({ ...manifest("compare-rem-cur"), sourceSha: "bbb2222" })
    );
    const result = compareRuns({
      baselineDir: base,
      currentDir: cur,
      remediationMode: true,
    });
    assert.equal(result.verdict, "unchanged");
    assert.ok(result.manifestNotes?.some((n) => n.includes("sourceSha")));
    rmSync(base, { force: true, recursive: true });
    rmSync(cur, { force: true, recursive: true });
  });

  it("detects new gate as regression without double-counting pass flip", () => {
    const base = path.join(devEvalsRoot, "compare-test-base");
    const cur = path.join(devEvalsRoot, "compare-test-cur");
    mkdirSync(path.join(base, "scenarios"), { recursive: true });
    mkdirSync(path.join(cur, "scenarios"), { recursive: true });
    const baseGrades = {
      grades: [
        {
          blockers: [],
          completeness: "complete",
          confidence: "high",
          excludedDimensions: [],
          gate: "pass",
          gateIds: [],
          officialEligible: true,
          quality: 80,
          scenarioId: "S05",
          scores: [],
          unverifiedDimensions: [],
        },
      ],
    };
    const curGrades = {
      grades: [
        {
          blockers: ["critical-gate-failure"],
          completeness: "complete",
          confidence: "high",
          excludedDimensions: [],
          gate: "fail",
          gateIds: ["unauthorized-build"],
          officialEligible: false,
          quality: null,
          scenarioId: "S05",
          scores: [],
          unverifiedDimensions: [],
        },
      ],
    };
    writeFileSync(path.join(base, "scores.json"), JSON.stringify(baseGrades));
    writeFileSync(path.join(cur, "scores.json"), JSON.stringify(curGrades));
    writeFileSync(
      path.join(base, "manifest.json"),
      JSON.stringify(manifest("compare-test-base"))
    );
    writeFileSync(
      path.join(cur, "manifest.json"),
      JSON.stringify(manifest("compare-test-cur"))
    );
    const result = compareRuns({ baselineDir: base, currentDir: cur });
    assert.equal(result.verdict, "regressed");
    assert.equal(result.regressed, 1);
    rmSync(base, { force: true, recursive: true });
    rmSync(cur, { force: true, recursive: true });
  });
});
