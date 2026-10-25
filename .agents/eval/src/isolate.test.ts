import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  applyArmMutations,
  captureAgentDiff,
  evalProductName,
  finalizePrepBaseline,
  installWorktreeDependencies,
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

describe("evalProductName", () => {
  it("slugifies to a portless-safe eval project name", () => {
    assert.equal(
      evalProductName({ repetition: 2, runId: "run-1", scenarioId: "S13" }),
      "product-ce6900803cb0"
    );
  });
});

describe("installWorktreeDependencies", () => {
  it("throws when pnpm install fails", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "flow-eval-install-"));
    const filePath = path.join(dir, "not-a-directory");
    writeFileSync(filePath, "blocked\n");
    assert.throws(
      () => installWorktreeDependencies({ worktreePath: filePath }),
      /pnpm install/u
    );
    rmSync(dir, { force: true, recursive: true });
  });
});

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

describe("applyArmMutations", () => {
  it("strips evaluator material and leaves an inert workspace package stub", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "flow-eval-arm-"));
    const oracleDir = path.join(dir, ".agents/eval/scenarios/oracles");
    mkdirSync(oracleDir, { recursive: true });
    writeFileSync(path.join(oracleDir, "S01.json"), "{}\n");
    mkdirSync(path.join(dir, ".agents/eval/src"), { recursive: true });
    writeFileSync(path.join(dir, ".agents/eval/RUN.md"), "evaluator secret\n");
    applyArmMutations({ arm: "flow", worktreePath: dir });
    assert.equal(existsSync(path.join(oracleDir, "S01.json")), false);
    assert.equal(existsSync(path.join(dir, ".agents/eval/src")), false);
    assert.equal(existsSync(path.join(dir, ".agents/eval/RUN.md")), false);
    assert.equal(existsSync(path.join(dir, ".agents/eval/scenarios")), false);
    assert.match(
      readFileSync(path.join(dir, ".agents/eval/package.json"), "utf8"),
      /@repo\/flow-eval/u
    );
    rmSync(dir, { force: true, recursive: true });
  });
});
