import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { before, describe, it } from "node:test";

import {
  hostSessionFinalize,
  loadHostSessionState,
  prepareHostRun,
} from "./host-session.ts";
import { runEvalDir } from "./paths.ts";

describe("host-session finalization outcomes", () => {
  before(() => {
    process.env.FLOW_EVAL_SKIP_PRODUCT_SETUP = "1";
  });

  it("all blocked jobs finalize as blocked with persisted outcome", async () => {
    const runId = `fin-all-blocked-${Date.now()}`;
    await prepareHostRun({
      arm: "flow",
      runId,
      scenarioIds: ["S01"],
    });
    const state = loadHostSessionState({ runId });
    assert.ok(state);
    const job = state.jobs[0];
    assert.ok(job);
    job.status = "blocked";
    const jobFile = path.join(
      runEvalDir(runId),
      "jobs",
      `${job.scenarioId}-r${job.repetition}.json`
    );
    mkdirSync(path.dirname(jobFile), { recursive: true });
    writeFileSync(jobFile, `${JSON.stringify(job, null, 2)}\n`);

    const finalized = await hostSessionFinalize({ runId });
    assert.equal(finalized.ok, false);
    assert.equal(finalized.outcome, "blocked");
    assert.equal(finalized.grades.length, 0);
    const outcomePath = `${runEvalDir(runId)}/finalization-outcome.json`;
    assert.ok(existsSync(outcomePath));
    const record = JSON.parse(readFileSync(outcomePath, "utf-8")) as {
      outcome: string;
    };
    assert.equal(record.outcome, "blocked");
  });

  it("interrupted session finalizes as partial", async () => {
    const runId = `fin-interrupt-${Date.now()}`;
    await prepareHostRun({ arm: "flow", runId, scenarioIds: ["S01"] });
    const finalized = await hostSessionFinalize({ runId });
    assert.equal(finalized.ok, false);
    assert.equal(finalized.outcome, "partial");
  });
});
