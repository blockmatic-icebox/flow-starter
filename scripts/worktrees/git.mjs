import { spawnSync } from "node:child_process";

export const runGit = ({
  cwd,
  args,
  allowFailure = false,
  env,
  stdio = "pipe",
}) => {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf-8",
    env: env ? { ...process.env, ...env } : process.env,
    maxBuffer: 20 * 1024 * 1024,
    stdio,
  });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  const status = result.status ?? 1;
  if (!allowFailure && status !== 0)
    throw new Error(
      `git ${args.map((a) => JSON.stringify(a)).join(" ")} failed (${status}): ${(stdout + stderr).slice(0, 800)}`
    );
  return { status, stderr, stdout };
};

export const revParse = ({ cwd, ref = "HEAD" }) =>
  runGit({ args: ["rev-parse", ref], cwd }).stdout.trim();

export const isCleanWorktree = ({ cwd }) => {
  const { stdout } = runGit({ args: ["status", "--porcelain"], cwd });
  return stdout.trim() === "";
};

/** Ignores untracked files (e.g. gitignored `.worktrees/`). */
export const isCleanTrackedTree = ({ cwd }) => {
  const index = runGit({
    allowFailure: true,
    args: ["diff-index", "--quiet", "HEAD"],
    cwd,
  });
  const staged = runGit({
    allowFailure: true,
    args: ["diff-index", "--quiet", "--cached", "HEAD"],
    cwd,
  });
  return index.status === 0 && staged.status === 0;
};

export const currentBranch = ({ cwd }) => {
  const { stdout, status } = runGit({
    allowFailure: true,
    args: ["symbolic-ref", "--short", "-q", "HEAD"],
    cwd,
  });
  if (status !== 0) return null;
  return stdout.trim();
};

export const worktreeTopLevel = ({ cwd }) =>
  runGit({ args: ["rev-parse", "--show-toplevel"], cwd }).stdout.trim();
