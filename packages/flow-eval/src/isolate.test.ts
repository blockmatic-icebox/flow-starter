import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  applyArmMutations,
  captureAgentDiff,
  finalizePrepBaseline,
  runGit,
} from "./isolate.ts";

const initRepo = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "flow-eval-isolate-"));
  runGit({ args: ["init"], cwd: dir });
  runGit({ args: ["config", "user.email", "t@local"], cwd: dir });
  runGit({ args: ["config", "user.name", "t"], cwd: dir });
  writeFileSync(path.join(dir, "README.md"), "base\n");
  runGit({ args: ["add", "README.md"], cwd: dir });
  runGit({ args: ["commit", "-m", "init"], cwd: dir });
  return dir;
};

describe("captureAgentDiff", () => {
  it("excludes harness baseline and includes agent untracked and committed changes", () => {
    const dir = initRepo();
    applyArmMutations({ arm: "control", worktreePath: dir });
    writeFileSync(path.join(dir, ".eval-meta.json"), "{}");
    const prep = finalizePrepBaseline({ worktreePath: dir });
    const harnessOnly = captureAgentDiff({
      baselineSha: prep.commitSha,
      worktreePath: dir,
    });
    assert.equal(harnessOnly.patch.trim(), "");

    writeFileSync(path.join(dir, "agent-new.txt"), "agent\n");
    const withUntracked = captureAgentDiff({
      baselineSha: prep.commitSha,
      worktreePath: dir,
    });
    assert.match(withUntracked.patch, /agent-new\.txt/u);

    writeFileSync(path.join(dir, "tracked.txt"), "x\n");
    runGit({ args: ["add", "tracked.txt"], cwd: dir });
    runGit({ args: ["commit", "-m", "agent commit"], cwd: dir });
    const withCommit = captureAgentDiff({
      baselineSha: prep.commitSha,
      worktreePath: dir,
    });
    assert.match(withCommit.commitsAfterBaseline, /agent commit/u);

    rmSync(dir, { force: true, recursive: true });
  });
});
