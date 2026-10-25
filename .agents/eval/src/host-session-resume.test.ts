import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { before, describe, it } from "node:test";

import {
  loadHostSessionState,
  prepareHostRun,
  resumeHostRun,
} from "./host-session.ts";
import { runEvalDir } from "./paths.ts";
import { trialScenarioDir } from "./trial-paths.ts";

describe("host-session prepare resume", () => {
  before(() => {
    process.env.FLOW_EVAL_SKIP_PRODUCT_SETUP = "1";
  });

  it("rejects duplicate prepare for the same run id", async () => {
    const runId = `dup-prepare-${Date.now()}`;
    const first = await prepareHostRun({
      arm: "flow",
      runId,
      scenarioIds: ["S01"],
    });
    assert.equal(first.ok, true);
    const second = await prepareHostRun({
      arm: "flow",
      runId,
      scenarioIds: ["S01"],
    });
    assert.equal(second.ok, false);
    if (second.ok) return;
    assert.match(second.reason, /already exists/u);
  });

  it("resume preserves transcript content and job status", async () => {
    const runId = `resume-transcript-${Date.now()}`;
    await prepareHostRun({ arm: "flow", runId, scenarioIds: ["S01"] });
    const scenarioDir = trialScenarioDir({
      repetition: 1,
      runId,
      scenarioId: "S01",
    });
    const transcriptPath = path.join(scenarioDir, "transcript.jsonl");
    writeFileSync(transcriptPath, '{"marker":"resume-test"}\n');

    const resumed = await resumeHostRun({
      arm: "flow",
      runId,
      scenarioIds: ["S01"],
    });
    assert.equal(resumed.ok, true);
    assert.equal(
      readFileSync(transcriptPath, "utf-8"),
      '{"marker":"resume-test"}\n'
    );
    const state = loadHostSessionState({ runId });
    assert.equal(state?.jobs[0]?.status, "pending");
  });

  it("resume is idempotent", async () => {
    const runId = `resume-idempotent-${Date.now()}`;
    await prepareHostRun({ arm: "flow", runId, scenarioIds: ["S01"] });
    const first = await resumeHostRun({
      arm: "flow",
      runId,
      scenarioIds: ["S01"],
    });
    const second = await resumeHostRun({
      arm: "flow",
      runId,
      scenarioIds: ["S01"],
    });
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (!first.ok || !second.ok) return;
    assert.equal(first.jobs.length, second.jobs.length);
  });

  it("restart allows prepare again after archiving", async () => {
    const runId = `restart-${Date.now()}`;
    await prepareHostRun({ arm: "flow", runId, scenarioIds: ["S01"] });
    const restarted = await prepareHostRun({
      arm: "flow",
      runId,
      scenarioIds: ["S01"],
      sessionMode: "restart",
    });
    assert.equal(restarted.ok, true);
    const attemptsPath = path.join(runEvalDir(runId), "attempts", "1");
    assert.ok(restarted.ok && existsSync(attemptsPath));
  });
});
