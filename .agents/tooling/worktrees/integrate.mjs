import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import { runAcceptance } from "./acceptance.mjs";
import { runGit, revParse, currentBranch, isCleanTrackedTree } from "./git.mjs";

export const integrationWorktreePath = ({ repoRoot, slug }) =>
  path.join(repoRoot, ".worktrees", slug, "_integrate");

export const integrationBranch = ({ slug }) => `wt/${slug}/_integrate`;

export const ensureIntegrationWorktree = ({ repoRoot, slug, mainRef }) => {
  const worktreePath = integrationWorktreePath({ repoRoot, slug });
  const branch = integrationBranch({ slug });
  mkdirSync(path.dirname(worktreePath), { recursive: true });

  if (existsSync(worktreePath)) {
    runGit({ args: ["checkout", branch], cwd: worktreePath });
    runGit({ args: ["reset", "--hard", mainRef], cwd: worktreePath });
    return worktreePath;
  }

  const { status } = runGit({
    allowFailure: true,
    args: ["show-ref", "--verify", `refs/heads/${branch}`],
    cwd: repoRoot,
  });
  if (status === 0)
    runGit({
      args: ["worktree", "add", worktreePath, branch],
      cwd: repoRoot,
    });
  else
    runGit({
      args: ["worktree", "add", "-b", branch, worktreePath, mainRef],
      cwd: repoRoot,
    });

  return worktreePath;
};

export const mergeTaskIntoIntegration = ({ integrationCwd, taskBranch }) => {
  runGit({ args: ["merge", "--no-edit", taskBranch], cwd: integrationCwd });
  const sha = revParse({ cwd: integrationCwd });
  return sha;
};

export const integrationMergeClean = ({ integrationCwd }) => {
  const { stdout } = runGit({
    args: ["status", "--porcelain"],
    cwd: integrationCwd,
  });
  const conflict = stdout
    .split("\n")
    .some((line) => line.startsWith("UU ") || line.startsWith("AA "));
  return !conflict && !stdout.includes("<<<<<<<");
};

export const advanceMainIfSafe = ({ repoRoot, candidateSha }) => {
  const branch = currentBranch({ cwd: repoRoot });
  const onMain = branch === "main" || branch === "master";
  const clean = isCleanTrackedTree({ cwd: repoRoot });
  const currentMain = revParse({ cwd: repoRoot, ref: "HEAD" });

  if (!onMain || !clean)
    return {
      advanced: false,
      candidateSha,
      mainBefore: currentMain,
      reason: onMain ? "dirty main checkout" : "main not checked out",
    };

  runGit({ args: ["merge", "--ff-only", candidateSha], cwd: repoRoot });
  const mainAfter = revParse({ cwd: repoRoot });
  return {
    advanced: true,
    candidateSha,
    mainAfter,
    mainBefore: currentMain,
  };
};

export const verifyOnIntegration = ({ integrationCwd, acceptance }) => {
  if (!acceptance) return { exitCode: 0, stderr: "", stdout: "" };
  return runAcceptance({ command: acceptance, cwd: integrationCwd });
};
