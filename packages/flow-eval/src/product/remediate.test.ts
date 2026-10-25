import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { runRemediationLoop } from "./remediate.ts";
import type { ReadinessReport } from "./types.ts";

const failingReport = (): ReadinessReport => ({
  blocked: 0,
  engineering: "FAIL",
  evaluatedRevision: "test",
  evidence: [
    {
      actual: "broken",
      caseId: "fixture-case",
      environment: "test",
      evaluatedSha: "test",
      evidenceRef: "fixture",
      executionMethod: "node test",
      expected: "pass",
      exitCode: 1,
      origin: "fixture",
      requirementId: "REQ-1",
      status: "failed",
    },
  ],
  failed: 1,
  features: "FAIL",
  passed: 0,
  releaseVerdict: "NOT_READY",
  requiredCriteria: 1,
  unverified: 0,
  usability: "INCONCLUSIVE",
});

const passingReport = (): ReadinessReport => ({
  ...failingReport(),
  engineering: "PASS",
  evidence: [],
  failed: 0,
  features: "PASS",
  passed: 1,
  releaseVerdict: "READY",
  usability: "PASS",
});

describe("remediation loop", () => {
  it("counts a cycle only when the tree hash changes", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "flow-remediate-"));
    const broken = path.join(dir, "value.txt");
    writeFileSync(broken, "broken");
    let pass = false;

    const loop = await runRemediationLoop({
      evaluate: () => (pass ? passingReport() : failingReport()),
      maxRemediationCycles: 3,
      repairExecutor: () => {
        writeFileSync(broken, "fixed");
        pass = true;
        return Promise.resolve({ applied: true, summary: "patched value.txt" });
      },
      runId: "remediate-test",
      workDir: dir,
    });

    assert.equal(loop.cyclesApplied, 1);
    assert.equal(loop.ok, true);
    assert.equal(readFileSync(broken, "utf-8"), "fixed");
  });

  it("does not count no-op repairs", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "flow-remediate-"));
    writeFileSync(path.join(dir, "value.txt"), "broken");

    const loop = await runRemediationLoop({
      evaluate: () => failingReport(),
      maxRemediationCycles: 3,
      repairExecutor: () => Promise.resolve({ applied: false }),
      runId: "remediate-noop",
      workDir: dir,
    });

    assert.equal(loop.cyclesApplied, 0);
    assert.equal(loop.stopReason, "no-progress");
  });

  it("stops without executor", async () => {
    const loop = await runRemediationLoop({
      evaluate: () => failingReport(),
      maxRemediationCycles: 3,
      runId: "remediate-absent",
    });
    assert.equal(loop.cyclesApplied, 0);
    assert.equal(loop.stopReason, "repair-executor-absent");
  });
});
