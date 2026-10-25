import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { compareRuns, manifestsCompatible } from "./compare.ts";
import { devEvalsRoot } from "./paths.ts";
import { rubricVersion } from "./rubric.ts";
import { PROTOCOL_ID } from "./trace.ts";
import type { EvalArm, RunManifest } from "./types.ts";

const manifest = (runId: string, sourceSha = "abc", arm: EvalArm = "flow") =>
  ({
    agentCliVersion: "2026.10.22",
    arm,
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
  }) satisfies RunManifest;

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

  it("allows arm mismatch in cross-arm mode", () => {
    const base = manifest("base", "abc", "control");
    const cur = manifest("cur", "abc", "flow");
    const { compatible, issues } = manifestsCompatible({
      baseline: base,
      crossArm: true,
      current: cur,
    });
    assert.equal(compatible, true);
    assert.equal(issues.length, 0);
  });

  it("rejects arm mismatch in same-arm mode", () => {
    const base = manifest("base", "abc", "control");
    const cur = manifest("cur", "abc", "flow");
    const { compatible, issues } = manifestsCompatible({
      baseline: base,
      current: cur,
    });
    assert.equal(compatible, false);
    assert.ok(issues.includes("arm mismatch"));
  });

  it("compares flow vs control runs in cross-arm mode", () => {
    const base = path.join(devEvalsRoot, "compare-cross-base");
    const cur = path.join(devEvalsRoot, "compare-cross-cur");
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
      JSON.stringify(manifest("compare-cross-base", "abc", "control"))
    );
    writeFileSync(
      path.join(cur, "manifest.json"),
      JSON.stringify(manifest("compare-cross-cur", "abc", "flow"))
    );
    const result = compareRuns({
      baselineDir: base,
      crossArm: true,
      currentDir: cur,
    });
    assert.equal(result.verdict, "unchanged");
    rmSync(base, { force: true, recursive: true });
    rmSync(cur, { force: true, recursive: true });
  });

  it("marks missing scenarios as inconclusive", () => {
    const base = path.join(devEvalsRoot, "compare-missing-base");
    const cur = path.join(devEvalsRoot, "compare-missing-cur");
    mkdirSync(base, { recursive: true });
    mkdirSync(cur, { recursive: true });
    writeFileSync(
      path.join(base, "scores.json"),
      JSON.stringify({
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
      })
    );
    writeFileSync(
      path.join(cur, "scores.json"),
      JSON.stringify({ grades: [] })
    );
    writeFileSync(
      path.join(base, "manifest.json"),
      JSON.stringify(manifest("compare-missing-base"))
    );
    writeFileSync(
      path.join(cur, "manifest.json"),
      JSON.stringify(manifest("compare-missing-cur"))
    );
    const result = compareRuns({ baselineDir: base, currentDir: cur });
    assert.equal(result.verdict, "inconclusive");
    rmSync(base, { force: true, recursive: true });
    rmSync(cur, { force: true, recursive: true });
  });

  it("detects quality decline as regression", () => {
    const base = path.join(devEvalsRoot, "compare-quality-base");
    const cur = path.join(devEvalsRoot, "compare-quality-cur");
    mkdirSync(base, { recursive: true });
    mkdirSync(cur, { recursive: true });
    const grade = {
      blockers: [],
      completeness: "complete",
      confidence: "high",
      excludedDimensions: [],
      gate: "pass",
      gateIds: [],
      officialEligible: true,
      scores: [],
      unverifiedDimensions: [],
    };
    writeFileSync(
      path.join(base, "scores.json"),
      JSON.stringify({
        grades: [{ ...grade, quality: 80, scenarioId: "S05" }],
      })
    );
    writeFileSync(
      path.join(cur, "scores.json"),
      JSON.stringify({
        grades: [{ ...grade, quality: 40, scenarioId: "S05" }],
      })
    );
    writeFileSync(
      path.join(base, "manifest.json"),
      JSON.stringify(manifest("compare-quality-base"))
    );
    writeFileSync(
      path.join(cur, "manifest.json"),
      JSON.stringify(manifest("compare-quality-cur"))
    );
    const result = compareRuns({ baselineDir: base, currentDir: cur });
    assert.equal(result.verdict, "regressed");
    assert.ok(result.qualityChanges.length > 0);
    rmSync(base, { force: true, recursive: true });
    rmSync(cur, { force: true, recursive: true });
  });

  it("regresses on a new gate even when another gate clears", () => {
    const base = path.join(devEvalsRoot, "compare-gate-mix-base");
    const cur = path.join(devEvalsRoot, "compare-gate-mix-cur");
    mkdirSync(base, { recursive: true });
    mkdirSync(cur, { recursive: true });
    writeFileSync(
      path.join(base, "scores.json"),
      JSON.stringify({
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
      })
    );
    writeFileSync(
      path.join(cur, "scores.json"),
      JSON.stringify({
        grades: [
          {
            blockers: ["critical-gate-failure"],
            completeness: "complete",
            confidence: "high",
            excludedDimensions: [],
            gate: "fail",
            gateIds: ["invented-scope"],
            officialEligible: false,
            quality: null,
            scenarioId: "S05",
            scores: [],
            unverifiedDimensions: [],
          },
        ],
      })
    );
    writeFileSync(
      path.join(base, "manifest.json"),
      JSON.stringify(manifest("compare-gate-mix-base"))
    );
    writeFileSync(
      path.join(cur, "manifest.json"),
      JSON.stringify(manifest("compare-gate-mix-cur"))
    );
    const result = compareRuns({ baselineDir: base, currentDir: cur });
    assert.equal(result.verdict, "regressed");
    rmSync(base, { force: true, recursive: true });
    rmSync(cur, { force: true, recursive: true });
  });
});
