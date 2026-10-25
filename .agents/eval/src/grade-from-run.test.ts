import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { gradeScenarioFromRunDir } from "./grade-from-run.ts";
import { devEvalsRoot } from "./paths.ts";
import { rubricVersion } from "./rubric.ts";
import { PROTOCOL_ID } from "./trace.ts";

const writeRun = ({
  runId,
  scenarioId,
  events,
  manifest,
}: {
  runId: string;
  scenarioId: string;
  events: string[];
  manifest?: Record<string, unknown> | null;
}) => {
  const scenarioDir = path.join(devEvalsRoot, runId, "scenarios", scenarioId);
  mkdirSync(scenarioDir, { recursive: true });
  writeFileSync(
    path.join(scenarioDir, "transcript.jsonl"),
    `${events.join("\n")}\n`
  );
  writeFileSync(path.join(scenarioDir, "diff.patch"), "");
  if (manifest !== null) {
    mkdirSync(path.join(devEvalsRoot, runId), { recursive: true });
    writeFileSync(
      path.join(devEvalsRoot, runId, "manifest.json"),
      JSON.stringify(manifest)
    );
  }
};

describe("gradeScenarioFromRunDir", () => {
  it("uses diagnostic harness when manifest is missing", () => {
    const runId = "grade-missing-manifest";
    writeRun({
      events: [],
      manifest: null,
      runId,
      scenarioId: "S05",
    });
    const grade = gradeScenarioFromRunDir({ runId, scenarioId: "S05" });
    assert.ok(grade.blockers.includes("unofficial-harness"));
    assert.equal(grade.officialEligible, false);
    rmSync(path.join(devEvalsRoot, runId), { force: true, recursive: true });
  });

  it("does not verify protocol when agent CLI version is unsupported", () => {
    const runId = "grade-unverified";
    writeRun({
      events: [],
      manifest: {
        agentCliVersion: "1.0.0",
        arm: "flow",
        catalogHash: "x",
        completeness: "complete",
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
        sourceSha: "abc",
        trustEnabled: true,
      },
      runId,
      scenarioId: "S05",
    });
    const grade = gradeScenarioFromRunDir({ runId, scenarioId: "S05" });
    assert.ok(grade.blockers.includes("unverified-protocol"));
    assert.equal(grade.officialEligible, false);
    rmSync(path.join(devEvalsRoot, runId), { force: true, recursive: true });
  });

  it("marks malformed transcript lines as partial telemetry", () => {
    const runId = "grade-malformed";
    writeRun({
      events: ["not-json"],
      manifest: {
        agentCliVersion: "2026.10.22",
        arm: "flow",
        catalogHash: "x",
        completeness: "complete",
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
        sourceSha: "abc",
        trustEnabled: true,
      },
      runId,
      scenarioId: "S05",
    });
    const grade = gradeScenarioFromRunDir({ runId, scenarioId: "S05" });
    assert.ok(grade.blockers.includes("unverified-protocol"));
    assert.ok(grade.blockers.includes("incomplete-telemetry"));
    rmSync(path.join(devEvalsRoot, runId), { force: true, recursive: true });
  });
});
