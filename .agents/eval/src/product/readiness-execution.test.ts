import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { repoRoot } from "../paths.ts";
import { runAllowlistedCase } from "./execute.ts";
import { evaluateReadiness } from "./readiness.ts";
import { allowlistedCases, productReleaseCaseIds } from "./registry.ts";

describe("readiness execution ownership", () => {
  it("defaults to product release cases only", () => {
    const readiness = evaluateReadiness({ runId: "default-cases" });
    const ids = readiness.evidence.map((e) => e.caseId);
    assert.deepEqual(ids.toSorted(), productReleaseCaseIds().toSorted());
    assert.equal(ids.includes("flow-eval-unit"), false);
  });

  it("blocks db acceptance when subject env is missing", () => {
    const dbCase = allowlistedCases().find(
      (c) => c.caseId === "db-starter-persist"
    );
    assert.ok(dbCase);
    const worktree = mkdtempSync(path.join(tmpdir(), "flow-readiness-exec-"));
    try {
      const row = runAllowlistedCase({
        caseDef: dbCase,
        evaluatedSha: "abc",
        runId: "exec-test",
        worktreePath: worktree,
      });
      assert.equal(row.runnerOwned, true);
      assert.equal(row.executionCwd, repoRoot);
      assert.equal(row.status, "blocked");
    } finally {
      rmSync(worktree, { force: true, recursive: true });
    }
  });

  it("runner db-acceptance script exists only at factory root", () => {
    const script = path.join(
      repoRoot,
      ".agents/eval/src/infrastructure/db-acceptance.ts"
    );
    assert.ok(existsSync(script));
  });
});
