import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isOwnedEvalDatabaseName } from "../subject-identity.ts";
import {
  cleanupOrphanedDatabasesForRun,
  cleanupTerminalJobDatabasesForRun,
  createDatabaseIfNotExists,
  dropOwnedDatabase,
} from "./database.ts";

describe("database lifecycle guards", () => {
  it("recognizes owned eval database names", () => {
    assert.ok(isOwnedEvalDatabaseName("flow_eval_a1b2c3d4"));
    assert.equal(isOwnedEvalDatabaseName("neondb"), false);
    assert.equal(isOwnedEvalDatabaseName("flow_eval_nothex"), false);
  });

  it("refuses to create non-eval database names", async () => {
    await assert.rejects(
      () =>
        createDatabaseIfNotExists({
          adminUrl: "postgres://neon:npg@localhost:5432/neondb",
          databaseName: "neondb",
        }),
      /refusing to create/u
    );
  });

  it("refuses to drop databases not registered for the run", async () => {
    await assert.rejects(
      () =>
        dropOwnedDatabase({
          adminUrl: "postgres://neon:npg@localhost:5432/neondb",
          databaseName: "flow_eval_a1b2c3d4",
          runId: `unregistered-${Date.now()}`,
        }),
      /not owned by run/u
    );
  });

  it("cleanup with empty registry is a noop", async () => {
    const result = await cleanupOrphanedDatabasesForRun({
      runId: `noop-cleanup-${Date.now()}`,
    });
    assert.equal(result.dropped, 0);
    assert.equal(result.results.length, 0);
  });

  it("resume-safe re-prepare skips pending job databases", async () => {
    const runId = `resume-cleanup-${Date.now()}`;
    const result = await cleanupTerminalJobDatabasesForRun({
      jobs: [
        { databaseName: "flow_eval_a1b2c3d4", status: "complete" },
        { databaseName: "flow_eval_b2c3d4e5", status: "pending" },
      ],
      runId,
    });
    assert.equal(result.results.length, 0);
    assert.equal(result.dropped, 0);
  });
});
