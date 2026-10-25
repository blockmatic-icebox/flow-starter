import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { runAcceptance } from "./acceptance.mjs";
import { renderBrief } from "./brief.mjs";
import {
  createScopedCheckpoint,
  resolveBaseRef,
  scopedCheckpointPaths,
} from "./checkpoint.mjs";
import { runGit, revParse } from "./git.mjs";
import { listAllTasks, tasksByIdMap } from "./initiative.mjs";
import {
  advanceMainIfSafe,
  ensureIntegrationWorktree,
  integrationMergeClean,
  integrationWorktreePath,
  verifyOnIntegration,
} from "./integrate.mjs";
import { acquireIntegrateLock } from "./lock.mjs";
import { commitTaskChanges, findOutOfScopePaths } from "./ownership.mjs";
import { loadQuestionReport } from "./reports.mjs";
import {
  getTaskRecord,
  initState,
  loadState,
  readyTaskIds,
  saveState,
  setTaskStatus,
} from "./state.mjs";

export const branchName = ({ slug, taskId }) => `wt/${slug}/${taskId}`;

export const worktreePathForTask = ({ repoRoot, slug, taskId }) =>
  path.join(repoRoot, ".worktrees", slug, taskId);

export const briefPathForTask = ({ repoRoot, slug, taskId }) =>
  path.join(repoRoot, ".worktrees", "briefs", slug, `${taskId}.md`);

export const ensureState = ({ repoRoot, slug, parsed, sourceRevision }) => {
  let state = loadState({ repoRoot, slug });
  if (state) return state;

  const tasks = listAllTasks(parsed);
  const writesUnion = [...new Set(tasks.flatMap((t) => t.writes))];
  const checkpointPaths = scopedCheckpointPaths({
    repoRoot,
    writesUnion,
  });
  const { checkpointSha } = createScopedCheckpoint({
    paths: checkpointPaths,
    repoRoot,
  });

  state = initState({
    checkpointPaths,
    checkpointSha,
    slug,
    sourceRevision,
    tasks,
  });
  saveState({ repoRoot, slug, state });
  return state;
};

export const prepareTaskWorktree = ({
  repoRoot,
  slug,
  state,
  task,
  initiativeRelative,
}) => {
  const record = getTaskRecord(state, task.id);
  if (record.worktreePath && existsSync(record.worktreePath)) {
    if (record.status === "pending") setTaskStatus(state, task.id, "ready", {});
    return record.worktreePath;
  }

  const resolved = resolveBaseRef({ repoRoot, state, task });
  if (resolved.error) throw new Error(resolved.error);
  const ref = resolved.ref;

  const branch = branchName({ slug, taskId: task.id });
  const worktreePath = worktreePathForTask({ repoRoot, slug, taskId: task.id });
  const briefPath = briefPathForTask({ repoRoot, slug, taskId: task.id });

  mkdirSync(path.dirname(worktreePath), { recursive: true });
  mkdirSync(path.dirname(briefPath), { recursive: true });

  if (existsSync(worktreePath))
    throw new Error(`worktree already exists: ${worktreePath}`);

  const branchExists =
    runGit({
      allowFailure: true,
      args: ["show-ref", "--verify", `refs/heads/${branch}`],
      cwd: repoRoot,
    }).status === 0;

  if (branchExists)
    runGit({
      args: ["worktree", "add", worktreePath, branch],
      cwd: repoRoot,
    });
  else
    runGit({
      args: ["worktree", "add", "-b", branch, worktreePath, ref],
      cwd: repoRoot,
    });

  writeFileSync(
    briefPath,
    renderBrief({
      baseSha: ref,
      initiativeRelative,
      slug,
      task,
    }),
    "utf-8"
  );

  setTaskStatus(state, task.id, "ready", {
    baseSha: ref,
    branch,
    worktreePath,
  });

  return worktreePath;
};

export const prepareReadyTasks = ({
  repoRoot,
  slug,
  parsed,
  waveFilter,
  initiativeRelative,
}) => {
  const sourceRevision = revParse({ cwd: repoRoot });
  const state = ensureState({ parsed, repoRoot, slug, sourceRevision });
  const tasksById = tasksByIdMap(parsed);

  const ready = readyTaskIds(state, tasksById).filter((id) => {
    if (!waveFilter) return true;
    return tasksById.get(id)?.wave === waveFilter;
  });

  for (const taskId of ready) {
    prepareTaskWorktree({
      initiativeRelative,
      repoRoot,
      slug,
      state,
      task: tasksById.get(taskId),
    });
  }

  saveState({ repoRoot, slug, state });
  return { prepared: ready, state, tasksById };
};

export const verifyTaskResult = ({ state, task, repoRoot, slug }) => {
  const record = getTaskRecord(state, task.id);
  const cwd = record.worktreePath;
  if (!cwd) return { ok: false, reason: "missing worktree" };

  setTaskStatus(state, task.id, "verifying");

  if (task.mode === "question") {
    const questionOutOfScope = findOutOfScopePaths({
      baseSha: record.baseSha,
      cwd,
      writes: [],
    });
    if (questionOutOfScope.length > 0) {
      setTaskStatus(state, task.id, "failed", {
        error: `question task must not modify files: ${questionOutOfScope.join(", ")}`,
      });
      return { ok: false, reason: "question task dirty" };
    }
    const report = loadQuestionReport({ repoRoot, slug, taskId: task.id });
    if (!report?.summary?.trim()) {
      setTaskStatus(state, task.id, "failed", {
        error: "missing question worker report",
      });
      return { ok: false, reason: "missing question report" };
    }
    setTaskStatus(state, task.id, "ready-to-integrate", {
      questionReportPath: report.path,
    });
    return { ok: true };
  }

  const outOfScope = findOutOfScopePaths({
    baseSha: record.baseSha,
    cwd,
    writes: task.writes,
  });
  if (outOfScope.length > 0) {
    setTaskStatus(state, task.id, "failed", {
      error: `out-of-scope: ${outOfScope.join(", ")}`,
    });
    return { ok: false, outOfScope };
  }

  const commitResult = commitTaskChanges({
    baseSha: record.baseSha,
    cwd,
    taskId: task.id,
    writes: task.writes,
  });
  if (!commitResult.ok) {
    setTaskStatus(state, task.id, "failed", {
      error: commitResult.reason,
      outOfScope: commitResult.outOfScope,
    });
    return { ok: false, ...commitResult };
  }

  const acceptance = runAcceptance({ command: task.acceptance, cwd });
  setTaskStatus(state, task.id, "verifying", {
    acceptance: {
      exitCode: acceptance.exitCode,
      stderr: acceptance.stderr.slice(0, 2000),
      stdout: acceptance.stdout.slice(0, 2000),
    },
  });

  if (acceptance.exitCode !== 0) {
    setTaskStatus(state, task.id, "failed", {
      error: `acceptance failed with ${acceptance.exitCode}`,
    });
    return { acceptance, ok: false };
  }

  setTaskStatus(state, task.id, "ready-to-integrate");
  return { acceptance, ok: true };
};

export const integrateTask = ({ repoRoot, slug, state, task }) => {
  const lock = acquireIntegrateLock({ repoRoot });
  if (!lock.ok) return { ok: false, reason: lock.reason };

  try {
    const record = getTaskRecord(state, task.id);
    if (record.status !== "ready-to-integrate")
      return {
        ok: false,
        reason: `task ${task.id} not ready to integrate (${record.status})`,
      };

    if (record.worktreePath) {
      const integrationOutOfScope = findOutOfScopePaths({
        baseSha: record.baseSha,
        cwd: record.worktreePath,
        writes: task.writes,
      });
      if (integrationOutOfScope.length > 0) {
        setTaskStatus(state, task.id, "failed", {
          error: `out-of-scope at integration: ${integrationOutOfScope.join(", ")}`,
        });
        return { ok: false, outOfScope: integrationOutOfScope };
      }
    }

    const mainRef = revParse({ cwd: repoRoot, ref: "HEAD" });
    const integrationCwd = ensureIntegrationWorktree({
      mainRef,
      repoRoot,
      slug,
    });

    const mergeResult = runGit({
      allowFailure: true,
      args: ["merge", "--no-edit", record.branch],
      cwd: integrationCwd,
    });
    if (mergeResult.status !== 0) {
      runGit({
        allowFailure: true,
        args: ["merge", "--abort"],
        cwd: integrationCwd,
      });
      setTaskStatus(state, task.id, "blocked", {
        blockedReason: "merge conflict",
      });
      return { blocked: true, ok: false };
    }

    if (!integrationMergeClean({ integrationCwd })) {
      runGit({
        allowFailure: true,
        args: ["merge", "--abort"],
        cwd: integrationCwd,
      });
      setTaskStatus(state, task.id, "blocked", {
        blockedReason: "merge conflict markers present",
      });
      return { blocked: true, ok: false };
    }

    const verify = verifyOnIntegration({
      acceptance: task.acceptance,
      integrationCwd,
    });
    if (verify.exitCode !== 0) {
      setTaskStatus(state, task.id, "failed", {
        error: `integration acceptance failed: ${verify.exitCode}`,
      });
      return { ok: false, verify };
    }

    const candidateSha = revParse({ cwd: integrationCwd });
    const advance =
      task.advanceMain === false
        ? {
            advanced: false,
            candidateSha,
            mainBefore: revParse({ cwd: repoRoot, ref: "HEAD" }),
            reason: "advanceMain disabled",
          }
        : advanceMainIfSafe({ candidateSha, repoRoot });

    if (!advance.advanced) {
      if (task.advanceMain === false) {
        setTaskStatus(state, task.id, "integrated", {
          integrationSha: candidateSha,
        });
        state.integrationHead = candidateSha;
        return { integrationSha: candidateSha, ok: true };
      }
      setTaskStatus(state, task.id, "blocked", {
        blockedReason: advance.reason,
        integrationSha: candidateSha,
      });
      return { blocked: true, candidateSha, ok: false };
    }

    setTaskStatus(state, task.id, "integrated", {
      integrationSha: advance.mainAfter,
    });
    state.integrationHead = advance.mainAfter;
    return { integrationSha: advance.mainAfter, ok: true };
  } finally {
    lock.release();
  }
};

export const runIntegratedAcceptance = ({ repoRoot, slug, command }) => {
  if (!command) return { exitCode: 0, stderr: "", stdout: "" };
  const integrationCwd = integrationWorktreePath({ repoRoot, slug });
  if (!existsSync(integrationCwd))
    return runAcceptance({ command, cwd: repoRoot });
  return runAcceptance({ command, cwd: integrationCwd });
};

export const safeCleanupTask = ({ repoRoot, slug, state, taskId, force }) => {
  const record = getTaskRecord(state, taskId);
  if (!record?.worktreePath || !existsSync(record.worktreePath))
    return { ok: true, skipped: true };

  if (!force && record.status !== "integrated" && !record.preserved)
    return {
      ok: false,
      reason: `task ${taskId} not integrated (${record.status})`,
    };

  if (record.workerPid) {
    try {
      process.kill(record.workerPid, 0);
      return { ok: false, reason: `worker still running: ${record.workerPid}` };
    } catch {
      // not running
    }
  }

  const remove = runGit({
    allowFailure: true,
    args: ["worktree", "remove", record.worktreePath],
    cwd: repoRoot,
  });
  if (remove.status !== 0 && !force)
    return { ok: false, reason: "worktree remove refused (dirty?)" };

  if (record.branch) {
    runGit({
      allowFailure: true,
      args: ["branch", "-d", record.branch],
      cwd: repoRoot,
    });
  }

  const brief = briefPathForTask({ repoRoot, slug, taskId });
  if (existsSync(brief)) rmSync(brief, { force: true });

  return { ok: true };
};
