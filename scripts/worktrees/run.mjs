import os from "node:os";

import {
  probeCursorAgent,
  runCommandWorker,
  runCursorWorker,
} from "./host.mjs";
import { listAllTasks } from "./initiative.mjs";
import {
  integrateTask,
  prepareReadyTasks,
  verifyTaskResult,
} from "./lifecycle.mjs";
import { loadState, saveState, setTaskStatus } from "./state.mjs";

const capacity = () => {
  const env = process.env.FLOW_WORKTREE_CAPACITY;
  if (env) return Math.max(1, Math.trunc(Number(env)) || 1);
  return Math.max(1, os.availableParallelism?.() ?? 4);
};

const workerPrompt = ({ repoRoot, slug, taskId }) =>
  `You are a Flow builder worker. Read the brief at ${repoRoot}/.worktrees/briefs/${slug}/${taskId}.md and complete the task. Change only listed writes. Run acceptance when done.`;

const executeWorker = ({
  host,
  workerCommand,
  model,
  repoRoot,
  slug,
  task,
  record,
}) => {
  if (task.mode === "question") return { exitCode: 0, ok: true };

  if (workerCommand)
    return runCommandWorker({
      command: workerCommand,
      env: { FLOW_SLUG: slug, FLOW_TASK_ID: task.id },
      worktreePath: record.worktreePath,
    });

  if (host === "cursor")
    return runCursorWorker({
      model,
      prompt: workerPrompt({ repoRoot, slug, taskId: task.id }),
      worktreePath: record.worktreePath,
    });

  return { exitCode: 1, ok: false, reason: "no worker configured" };
};

const hasOutstandingWork = (state, tasks) => {
  if (!state) return tasks.length > 0;
  return tasks.some((task) => {
    const status = state.tasks[task.id]?.status;
    return (
      status === "pending" ||
      status === "ready" ||
      status === "running" ||
      status === "verifying" ||
      status === "ready-to-integrate"
    );
  });
};

export const runInitiative = ({
  repoRoot,
  slug,
  parsed,
  initiativeRelative,
  waveFilter,
  host,
  workerCommand,
  model,
}) => {
  let hostWarning = null;
  let maxConcurrent = 1;
  let parallelClaimed = false;

  if (host === "cursor") {
    const probe = probeCursorAgent();
    if (!probe.ok) {
      hostWarning = probe.reason;
      if (!workerCommand)
        return { hostWarning, ok: false, reason: probe.reason };
    } else if (!workerCommand) {
      parallelClaimed = true;
      maxConcurrent = capacity();
    }
  }

  const tasks = listAllTasks(parsed);
  const results = [];

  while (hasOutstandingWork(loadState({ repoRoot, slug }), tasks)) {
    const { state } = prepareReadyTasks({
      initiativeRelative,
      parsed,
      repoRoot,
      slug,
      waveFilter,
    });

    const ready = tasks.filter((t) => state.tasks[t.id]?.status === "ready");
    if (ready.length === 0) break;

    const batch = ready.slice(0, maxConcurrent);
    for (const task of batch) {
      const record = state.tasks[task.id];
      setTaskStatus(state, task.id, "running");
      saveState({ repoRoot, slug, state });

      const workerResult = executeWorker({
        host,
        model,
        record,
        repoRoot,
        slug,
        task,
        workerCommand,
      });

      if (!workerResult.ok) {
        setTaskStatus(state, task.id, "failed", {
          error: workerResult.reason ?? `worker exit ${workerResult.exitCode}`,
        });
        results.push({ taskId: task.id, workerResult });
        saveState({ repoRoot, slug, state });
        continue;
      }

      const verified = verifyTaskResult({ state, task });
      if (!verified.ok) {
        results.push({ taskId: task.id, verified });
        saveState({ repoRoot, slug, state });
        continue;
      }

      if (task.mode === "build") {
        const integrated = integrateTask({ repoRoot, slug, state, task });
        results.push({ integrated, taskId: task.id });
      } else {
        setTaskStatus(state, task.id, "integrated", { integrationSha: null });
        results.push({ integrated: true, taskId: task.id });
      }
      saveState({ repoRoot, slug, state });
    }
  }

  const state = loadState({ repoRoot, slug });
  return {
    hostWarning,
    maxConcurrent,
    ok: true,
    parallelClaimed,
    results,
    state,
  };
};

export const runSequentialForTests = ({
  repoRoot,
  slug,
  parsed,
  initiativeRelative,
  workerFn,
}) => {
  const tasks = listAllTasks(parsed);

  while (hasOutstandingWork(loadState({ repoRoot, slug }), tasks)) {
    const { state } = prepareReadyTasks({
      initiativeRelative,
      parsed,
      repoRoot,
      slug,
    });

    const ready = tasks.filter((t) => state.tasks[t.id]?.status === "ready");
    if (ready.length === 0) break;

    for (const task of ready) {
      const record = state.tasks[task.id];
      setTaskStatus(state, task.id, "running");
      workerFn({ record, repoRoot, state, task });
      const verified = verifyTaskResult({ state, task });
      if (!verified.ok) {
        saveState({ repoRoot, slug, state });
        return { ok: false, state, taskId: task.id, verified };
      }
      if (task.mode === "build") {
        const integrated = integrateTask({ repoRoot, slug, state, task });
        if (!integrated.ok) {
          saveState({ repoRoot, slug, state });
          return { integrated, ok: false, state, taskId: task.id };
        }
      } else
        setTaskStatus(state, task.id, "integrated", { integrationSha: null });

      saveState({ repoRoot, slug, state });
    }
  }

  const state = loadState({ repoRoot, slug });
  const failed = tasks.some((task) =>
    ["blocked", "failed"].includes(state?.tasks[task.id]?.status)
  );
  const allIntegrated = tasks.every(
    (task) => state?.tasks[task.id]?.status === "integrated"
  );
  if (failed || !allIntegrated)
    return { allIntegrated, failed, ok: false, state };
  return { ok: true, state };
};
