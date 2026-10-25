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
  EVALUATOR_GIT_AUTHOR_EMAIL,
  EVALUATOR_GIT_AUTHOR_NAME,
} from "./git-eval-identity.ts";
import {
  applyArmMutations,
  captureAgentDiff,
  evalProductName,
  finalizePrepBaseline,
  installWorktreeDependencies,
  runGit,
  setupWorktree,
} from "./isolate.ts";
import { repoRoot } from "./paths.ts";

const isolatedGitEnv = () => ({
  ...process.env,
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_SYSTEM: "/dev/null",
});

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
      evalProductName({
        arm: "flow",
        repetition: 2,
        runId: "run-1",
        scenarioId: "S13",
      }),
      "product-e3f9c211"
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

describe("setupWorktree", () => {
  it("does not write eval-meta into the subject worktree", () => {
    const flowSha = runGit({
      args: ["rev-parse", "HEAD"],
      cwd: repoRoot,
    }).stdout.trim();
    const { trialRunnerMeta, worktreePath, worktreeName } = setupWorktree({
      arm: "flow",
      flowSha,
      repetition: 1,
      runId: "isolate-test-run",
      scenarioId: "S01",
      skipInstall: true,
    });
    assert.equal(existsSync(path.join(worktreePath, ".eval-meta.json")), false);
    assert.equal(trialRunnerMeta.scenarioId, "S01");
    assert.equal(trialRunnerMeta.arm, "flow");
    runGit({
      args: ["worktree", "remove", "--force", worktreePath],
      cwd: repoRoot,
    });
    assert.ok(worktreeName.startsWith("ws-"));
  });
});

describe("finalizePrepBaseline git identity", () => {
  it("commits with Factory identity when repo has no user config", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "flow-eval-git-id-"));
    runGit({
      args: ["init"],
      cwd: dir,
      env: isolatedGitEnv(),
    });
    writeFileSync(path.join(dir, "staged.txt"), "x\n");
    const prep = finalizePrepBaseline({ worktreePath: dir });
    assert.ok(prep.commitSha);
    const log = runGit({
      args: ["log", "-1", "--format=%an|%ae"],
      cwd: dir,
      env: isolatedGitEnv(),
    }).stdout.trim();
    assert.equal(
      log,
      `${EVALUATOR_GIT_AUTHOR_NAME}|${EVALUATOR_GIT_AUTHOR_EMAIL}`
    );
    rmSync(dir, { force: true, recursive: true });
  });

  it("does not change developer git config in the repo", () => {
    const dir = initRepo();
    const beforeName = runGit({
      args: ["config", "user.name"],
      cwd: dir,
    }).stdout.trim();
    const beforeEmail = runGit({
      args: ["config", "user.email"],
      cwd: dir,
    }).stdout.trim();
    writeFileSync(path.join(dir, "extra.txt"), "y\n");
    finalizePrepBaseline({ worktreePath: dir });
    assert.equal(
      runGit({ args: ["config", "user.name"], cwd: dir }).stdout.trim(),
      beforeName
    );
    assert.equal(
      runGit({ args: ["config", "user.email"], cwd: dir }).stdout.trim(),
      beforeEmail
    );
    rmSync(dir, { force: true, recursive: true });
  });

  it("allows empty baseline commit when tree is clean", () => {
    const dir = initRepo();
    const prep = finalizePrepBaseline({ worktreePath: dir });
    assert.ok(prep.commitSha);
    rmSync(dir, { force: true, recursive: true });
  });

  it("parallel baselines produce distinct commit SHAs", async () => {
    const dirs = [0, 1].map(() => {
      const dir = mkdtempSync(path.join(tmpdir(), "flow-eval-par-"));
      runGit({ args: ["init"], cwd: dir, env: isolatedGitEnv() });
      writeFileSync(path.join(dir, "f.txt"), `${dir}\n`);
      return dir;
    });
    const preps = await Promise.all(
      dirs.map((dir) => finalizePrepBaseline({ worktreePath: dir }))
    );
    assert.notEqual(preps[0]?.commitSha, preps[1]?.commitSha);
    for (const dir of dirs) rmSync(dir, { force: true, recursive: true });
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
