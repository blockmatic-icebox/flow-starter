import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { after, describe, it } from "node:test";

import { runEvalDir } from "../paths.ts";
import {
  loadDatabaseRegistry,
  markDatabaseDropped,
  registerSubjectDatabase,
} from "./database-registry.ts";

describe("database-registry", () => {
  const runId = `registry-test-${Date.now()}`;

  after(() => {
    const dir = runEvalDir(runId);
    if (existsSync(dir)) rmSync(dir, { force: true, recursive: true });
  });

  it("registers and marks dropped", async () => {
    await registerSubjectDatabase({
      databaseName: "flow_eval_a1b2c3d4",
      runId,
      subjectKey: "flow:S01:1",
    });
    const loaded = loadDatabaseRegistry({ runId });
    assert.equal(loaded.entries.filter((e) => e.status === "active").length, 1);
    await markDatabaseDropped({ databaseName: "flow_eval_a1b2c3d4", runId });
    assert.equal(
      loadDatabaseRegistry({ runId }).entries.find(
        (e) => e.databaseName === "flow_eval_a1b2c3d4"
      )?.status,
      "dropped"
    );
  });

  it("serializes concurrent register calls", async () => {
    const parallelRun = `registry-parallel-${Date.now()}`;
    await Promise.all(
      ["flow_eval_a1b2c3d4", "flow_eval_b2c3d4e5", "flow_eval_c3d4e5f6"].map(
        (databaseName, index) =>
          registerSubjectDatabase({
            databaseName,
            runId: parallelRun,
            subjectKey: `flow:S0${index + 1}:1`,
          })
      )
    );
    const active = loadDatabaseRegistry({ runId: parallelRun }).entries.filter(
      (e) => e.status === "active"
    );
    assert.equal(active.length, 3);
    const dir = runEvalDir(parallelRun);
    if (existsSync(dir)) rmSync(dir, { force: true, recursive: true });
  });
});
