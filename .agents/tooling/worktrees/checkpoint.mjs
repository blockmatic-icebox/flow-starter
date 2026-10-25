import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { isParentOwnedWrite } from "./constants.mjs";
import { runGit, revParse } from "./git.mjs";
import { pathOwnedBy } from "./paths.mjs";

export const listDirtyPaths = ({ repoRoot }) => {
  const { stdout } = runGit({
    args: ["status", "--porcelain", "-uall"],
    cwd: repoRoot,
  });
  const paths = new Set();
  for (const line of stdout.split("\n").filter(Boolean)) {
    const raw = line.slice(3).trim();
    if (raw.includes(" -> ")) {
      paths.add(raw.split(" -> ").at(-1)?.trim() ?? raw);
      continue;
    }
    paths.add(raw);
  }
  return [...paths];
};

const isIgnored = ({ repoRoot, filePath }) => {
  const { status } = runGit({
    allowFailure: true,
    args: ["check-ignore", "-q", filePath],
    cwd: repoRoot,
  });
  return status === 0;
};

export const scopedCheckpointPaths = ({ repoRoot, writesUnion }) => {
  const dirty = listDirtyPaths({ repoRoot });
  const included = [];
  for (const filePath of dirty) {
    if (isIgnored({ filePath, repoRoot })) continue;
    if (isParentOwnedWrite(filePath)) continue;
    if (!pathOwnedBy({ path: filePath, writes: writesUnion })) continue;
    included.push(filePath);
  }
  return included;
};

export const createScopedCheckpoint = ({ repoRoot, paths: filePaths }) => {
  if (filePaths.length === 0)
    return { checkpointPaths: [], checkpointSha: null };

  const tmpIndex = path.join(
    mkdtempSync(path.join(os.tmpdir(), "flow-wt-index-")),
    "index"
  );
  const headTree = revParse({ cwd: repoRoot, ref: "HEAD^{tree}" });
  const parent = revParse({ cwd: repoRoot, ref: "HEAD" });

  runGit({
    args: ["read-tree", headTree],
    cwd: repoRoot,
    env: { GIT_INDEX_FILE: tmpIndex },
  });

  for (const filePath of filePaths) {
    runGit({
      allowFailure: true,
      args: ["add", "--", filePath],
      cwd: repoRoot,
      env: { GIT_INDEX_FILE: tmpIndex },
    });
  }

  const treeSha = runGit({
    args: ["write-tree"],
    cwd: repoRoot,
    env: { GIT_INDEX_FILE: tmpIndex },
  }).stdout.trim();

  const commitSha = runGit({
    args: [
      "commit-tree",
      treeSha,
      "-p",
      parent,
      "-m",
      "flow-worktrees scoped checkpoint",
    ],
    cwd: repoRoot,
  }).stdout.trim();

  try {
    rmSync(path.dirname(tmpIndex), { force: true, recursive: true });
  } catch {
    // ignore
  }

  return { checkpointPaths: filePaths, checkpointSha: commitSha };
};

const isAncestor = ({ repoRoot, ancestor, descendant }) => {
  if (ancestor === descendant) return true;
  const { status } = runGit({
    allowFailure: true,
    args: ["merge-base", "--is-ancestor", ancestor, descendant],
    cwd: repoRoot,
  });
  return status === 0;
};

export const resolveBaseRef = ({ repoRoot, state, task }) => {
  if (task.depends_on.length === 0)
    return {
      ref: state.checkpointSha ?? state.sourceRevision,
    };

  const depShas = task.depends_on
    .map((dep) => state.tasks[dep]?.integrationSha)
    .filter(Boolean);

  const containsAllDeps = (candidate) =>
    depShas.every((sha) =>
      isAncestor({ ancestor: sha, descendant: candidate, repoRoot })
    );

  const candidates = [
    state.integrationHead,
    ...depShas,
    state.checkpointSha,
    state.sourceRevision,
  ].filter(Boolean);

  for (const candidate of new Set(candidates)) {
    if (depShas.length === 0 || containsAllDeps(candidate))
      return { ref: candidate };
  }

  return {
    error: `task ${task.id}: no integrated base contains all dependencies`,
  };
};
