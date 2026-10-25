import assert from "node:assert/strict";
import test from "node:test";

import { validateCommitMessageText } from "../../../tooling/checks/check-commit-message.mjs";
import { isConventionalCommitSubject } from "../../../tooling/checks/conventional-commit.mjs";
import { findNonConventionalSubjects } from "./check-commits.mjs";

test("accepts conventional subjects aligned with PR title types", () => {
  assert.equal(isConventionalCommitSubject("feat(web): add triage"), true);
  assert.equal(isConventionalCommitSubject("fix!: breaking repair"), true);
  assert.equal(isConventionalCommitSubject("chore(deps): bump lockfile"), true);
});

test("rejects missing type or description", () => {
  assert.equal(isConventionalCommitSubject("Add something"), false);
  assert.equal(isConventionalCommitSubject("feat: "), false);
  assert.equal(isConventionalCommitSubject(""), false);
});

test("validates full commit message files", () => {
  const ok = validateCommitMessageText("fix(flow): repair hook\n\nBody line.");
  assert.equal(ok.ok, true);

  const bad = validateCommitMessageText("Fix something\n");
  assert.equal(bad.ok, false);
});

test("finds invalid subjects in a batch", () => {
  const invalid = findNonConventionalSubjects(["feat: ok", "Fix things"]);
  assert.deepEqual(invalid, ["Fix things"]);
});
