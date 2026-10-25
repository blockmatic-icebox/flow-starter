import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const GIT_IDENTITY = {
  GIT_AUTHOR_EMAIL: "test@flow-factory.local",
  GIT_AUTHOR_NAME: "flow-factory-install-test",
  GIT_COMMITTER_EMAIL: "test@flow-factory.local",
  GIT_COMMITTER_NAME: "flow-factory-install-test",
};

const runGit = ({ args, cwd, env = {} }) => {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf-8",
    env: { ...process.env, ...GIT_IDENTITY, ...env },
  });
  if (result.status !== 0)
    throw new Error(
      `git ${args.join(" ")} failed: ${result.stderr || result.stdout}`
    );
  return (result.stdout ?? "").trim();
};

const listSnapshotPaths = (repoRoot) => {
  const tracked = runGit({
    args: ["ls-files", "-z"],
    cwd: repoRoot,
  })
    .split("\0")
    .filter(Boolean);
  const modified = runGit({
    args: ["diff", "--name-only", "-z"],
    cwd: repoRoot,
  })
    .split("\0")
    .filter(Boolean);
  const untracked = runGit({
    args: ["ls-files", "--others", "--exclude-standard", "-z"],
    cwd: repoRoot,
  })
    .split("\0")
    .filter(Boolean);
  return [...new Set([...tracked, ...modified, ...untracked])];
};

const copyPath = ({ fromRoot, relative, toRoot }) => {
  const source = path.join(fromRoot, relative);
  if (!existsSync(source)) return;
  const target = path.join(toRoot, relative);
  mkdirSync(path.dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true });
};

export const createLocalInstallSource = ({ repoRoot }) => {
  const snapshotRoot = mkdtempSync(path.join(tmpdir(), "flow-factory-source-"));
  const paths = listSnapshotPaths(repoRoot);
  for (const relative of paths)
    copyPath({ fromRoot: repoRoot, relative, toRoot: snapshotRoot });

  runGit({ args: ["init", "-b", "main"], cwd: snapshotRoot });
  runGit({ args: ["add", "-A"], cwd: snapshotRoot });
  runGit({
    args: ["commit", "-m", "flow-factory install test snapshot"],
    cwd: snapshotRoot,
  });

  const sourceUrl = `file://${snapshotRoot}`;

  return {
    cleanup: () => {
      rmSync(snapshotRoot, {
        force: true,
        maxRetries: 5,
        recursive: true,
        retryDelay: 50,
      });
    },
    snapshotRoot,
    sourceUrl,
  };
};
