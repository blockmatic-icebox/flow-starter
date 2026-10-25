import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildSubjectIdentity,
  isOwnedEvalDatabaseName,
  subjectIdentityHash,
} from "./subject-identity.ts";

describe("buildSubjectIdentity", () => {
  it("includes arm so flow and control do not collide", () => {
    const base = {
      repetition: 1,
      runId: "run-1",
      scenarioId: "S13",
    };
    const flow = buildSubjectIdentity({ ...base, arm: "flow" });
    const control = buildSubjectIdentity({ ...base, arm: "control" });
    assert.notEqual(flow.hash, control.hash);
    assert.notEqual(flow.worktreeName, control.worktreeName);
    assert.notEqual(flow.databaseName, control.databaseName);
  });

  it("produces PostgreSQL-safe database names within length limits", () => {
    const id = buildSubjectIdentity({
      arm: "flow",
      repetition: 2,
      runId: "run-1",
      scenarioId: "S13",
    });
    assert.match(id.databaseName, /^flow_eval_[a-f0-9]{8}$/u);
    assert.ok(id.databaseName.length <= 63);
    assert.ok(isOwnedEvalDatabaseName(id.databaseName));
  });

  it("stable hash for fixed inputs", () => {
    const hash = subjectIdentityHash({
      arm: "flow",
      repetition: 2,
      runId: "run-1",
      scenarioId: "S13",
    });
    assert.equal(
      buildSubjectIdentity({
        arm: "flow",
        repetition: 2,
        runId: "run-1",
        scenarioId: "S13",
      }).productName,
      `product-${hash}`
    );
  });

  it("prepareNonce changes identity for concurrent safety", () => {
    const base = {
      arm: "flow" as const,
      repetition: 1,
      runId: "run-1",
      scenarioId: "S01",
    };
    const a = buildSubjectIdentity({ ...base, prepareNonce: "a" });
    const b = buildSubjectIdentity({ ...base, prepareNonce: "b" });
    assert.notEqual(a.hash, b.hash);
  });
});
