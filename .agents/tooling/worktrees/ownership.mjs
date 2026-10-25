import { runGit } from "./git.mjs";
import { pathOwnedBy } from "./paths.mjs";

export const collectTaskChangePaths = ({ baseSha, cwd }) => {
  const paths = new Set(collectWorktreeChanges({ cwd }));
  if (!baseSha) return [...paths];

  const { stdout } = runGit({
    args: ["diff", "--name-only", "--no-renames", baseSha, "HEAD"],
    cwd,
  });
  for (const line of stdout.split("\n").filter(Boolean)) paths.add(line);
  return [...paths];
};

export const collectWorktreeChanges = ({ cwd }) => {
  const { stdout: statusOut } = runGit({
    args: ["status", "--porcelain", "-uall"],
    cwd,
  });
  const paths = new Set();

  for (const line of statusOut.split("\n").filter(Boolean)) {
    const rest = line.slice(3).trim();
    if (rest.endsWith("/")) continue;
    if (rest.includes(" -> ")) {
      const [from, to] = rest.split(" -> ").map((s) => s.trim());
      if (from) paths.add(from);
      if (to) paths.add(to);
      continue;
    }
    paths.add(rest);
  }

  const { stdout: untracked } = runGit({
    args: ["ls-files", "--others", "--exclude-standard", "-z"],
    cwd,
  });
  for (const file of untracked.split("\0").filter(Boolean)) {
    if (file.endsWith("/")) continue;
    paths.add(file);
  }

  return [...paths];
};

export const findOutOfScopePaths = ({ baseSha, cwd, writes }) => {
  const changed = baseSha
    ? collectTaskChangePaths({ baseSha, cwd })
    : collectWorktreeChanges({ cwd });
  return changed.filter((p) => !pathOwnedBy({ path: p, writes }));
};

export const commitTaskChanges = ({ baseSha, cwd, taskId, writes }) => {
  const outOfScope = findOutOfScopePaths({ baseSha, cwd, writes });
  if (outOfScope.length > 0)
    return { ok: false, outOfScope, reason: "out-of-scope paths" };

  const changed = collectWorktreeChanges({ cwd });
  if (changed.length === 0) return { committed: false, ok: true };

  for (const file of changed) {
    runGit({ args: ["add", "--", file], cwd });
  }
  runGit({
    args: ["commit", "-m", `flow-worktrees task ${taskId}`, "--no-verify"],
    cwd,
  });
  return { committed: true, ok: true };
};
