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

  it("registers and marks dropped", () => {
    registerSubjectDatabase({
      databaseName: "flow_eval_a1b2c3d4",
      runId,
      subjectKey: "flow:S01:1",
    });
    const loaded = loadDatabaseRegistry({ runId });
    assert.equal(loaded.entries.filter((e) => e.status === "active").length, 1);
    markDatabaseDropped({ databaseName: "flow_eval_a1b2c3d4", runId });
    assert.equal(
      loadDatabaseRegistry({ runId }).entries.find(
        (e) => e.databaseName === "flow_eval_a1b2c3d4"
      )?.status,
      "dropped"
    );
  });
});
