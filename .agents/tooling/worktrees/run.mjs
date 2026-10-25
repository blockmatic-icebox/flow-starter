import os from "node:os";

import {
  probeCursorAgent,
  runCommandWorker,
  runCommandWorkerAsync,
  runCursorWorker,
  runCursorWorkerAsync,
} from "./host.mjs";
import { listAllTasks } from "./initiative.mjs";
import {
  integrateTask,
  prepareReadyTasks,
  runIntegratedAcceptance,
  verifyTaskResult,
} from "./lifecycle.mjs";
import { writeQuestionReport } from "./reports.mjs";
import { loadState, saveState, setTaskStatus } from "./state.mjs";

const capacity = () => {
  const env = process.env.FLOW_WORKTREE_CAPACITY;
  if (env) return Math.max(1, Math.trunc(Number(env)) || 1);
  return Math.max(1, os.availableParallelism?.() ?? 4);
};

const workerPrompt = ({ repoRoot, slug, taskId }) =>
  `You are a Flow builder worker. Read the brief at ${repoRoot}/.worktrees/briefs/${slug}/${taskId}.md and complete the task. Change only listed writes. Run acceptance when done.`;

const questionWorkerPrompt = ({ repoRoot, slug, taskId }) =>
  `You are a Flow read-only worker. Read the brief at ${repoRoot}/.worktrees/briefs/${slug}/${taskId}.md. Do not modify any files. Return a concise findings summary in your final message.`;

const executeWorkerSync = ({
  host,
  workerCommand,
  model,
  repoRoot,
  slug,
  task,
  record,
}) => {
  if (workerCommand)
    return runCommandWorker({
      command: workerCommand,
      env: { FLOW_SLUG: slug, FLOW_TASK_ID: task.id },
      worktreePath: record.worktreePath,
    });

  if (host === "cursor") {
    const prompt =
      task.mode === "question"
        ? questionWorkerPrompt({ repoRoot, slug, taskId: task.id })
        : workerPrompt({ repoRoot, slug, taskId: task.id });
    return runCursorWorker({
      model,
      prompt,
      worktreePath: record.worktreePath,
    });
  }

  return { exitCode: 1, ok: false, reason: "no worker configured" };
};

const executeWorkerAsync = async (input) => {
  const { host, model, repoRoot, slug, task, workerCommand, record } = input;
  if (workerCommand)
    return runCommandWorkerAsync({
      command: workerCommand,
      env: { FLOW_SLUG: slug, FLOW_TASK_ID: task.id },
      worktreePath: record.worktreePath,
    });

  if (host === "cursor") {
    const prompt =
      task.mode === "question"
        ? questionWorkerPrompt({ repoRoot, slug, taskId: task.id })
        : workerPrompt({ repoRoot, slug, taskId: task.id });
    const result = await runCursorWorkerAsync({
      model,
      prompt,
      worktreePath: record.worktreePath,
    });
    if (record && result.pid) record.workerPid = result.pid;
    return result;
  }

  return executeWorkerSync(input);
};

const persistQuestionOutcome = ({ repoRoot, slug, task, workerResult }) => {
  const summary = workerResult.stdout?.trim();
  if (!summary)
    return { ok: false, reason: "question worker returned empty output" };
  const report = writeQuestionReport({
    repoRoot,
    slug,
    summary,
    taskId: task.id,
  });
  return { ok: true, reportPath: report.path };
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

const finalizeRunStatus = ({ state, tasks }) => {
  const failed = tasks.some((task) =>
    ["blocked", "failed"].includes(state?.tasks[task.id]?.status)
  );
  const allIntegrated = tasks.every(
    (task) => state?.tasks[task.id]?.status === "integrated"
  );
  if (failed) return { ok: false, status: "failed" };
  if (!allIntegrated) return { ok: false, status: "partial" };
  return { ok: true, status: "completed" };
};

const processTask = async ({
  host,
  model,
  repoRoot,
  results,
  slug,
  state,
  task,
  workerCommand,
  workerFn,
}) => {
  const record = state.tasks[task.id];
  setTaskStatus(state, task.id, "running");
  saveState({ repoRoot, slug, state });

  const workerResult = workerFn
    ? await workerFn({ record, repoRoot, state, task })
    : await executeWorkerAsync({
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
    return;
  }

  let questionReportPath = null;
  if (task.mode === "question") {
    const persisted = persistQuestionOutcome({
      repoRoot,
      slug,
      task,
      workerResult,
    });
    if (!persisted.ok) {
      setTaskStatus(state, task.id, "failed", { error: persisted.reason });
      results.push({ persisted, taskId: task.id });
      saveState({ repoRoot, slug, state });
      return;
    }
    questionReportPath = persisted.reportPath;
  }

  const verified = verifyTaskResult({ repoRoot, slug, state, task });
  if (!verified.ok) {
    results.push({ taskId: task.id, verified });
    saveState({ repoRoot, slug, state });
    return;
  }

  if (task.mode === "build") {
    const integrated = integrateTask({ repoRoot, slug, state, task });
    results.push({ integrated, taskId: task.id });
  } else {
    setTaskStatus(state, task.id, "integrated", {
      integrationSha: null,
      questionReportPath,
    });
    results.push({ integrated: true, taskId: task.id });
  }
  saveState({ repoRoot, slug, state });
};

const runReadyBatch = async ({
  batch,
  host,
  maxConcurrent,
  model,
  repoRoot,
  results,
  slug,
  state,
  workerCommand,
  workerFn,
}) => {
  const limit = maxConcurrent;
  const queue = [...batch];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, () =>
    (async () => {
      while (queue.length > 0) {
        const task = queue.shift();
        if (!task) break;
        await processTask({
          host,
          model,
          repoRoot,
          results,
          slug,
          state,
          task,
          workerCommand,
          workerFn,
        });
      }
    })()
  );
  await Promise.all(workers);
};

export const runInitiative = async ({
  repoRoot,
  slug,
  parsed,
  initiativeRelative,
  waveFilter,
  host,
  workerCommand,
  model,
  workerFn,
}) => {
  let hostWarning = null;
  let maxConcurrent = 1;
  let parallelClaimed = false;

  if (host === "cursor") {
    const probe = probeCursorAgent();
    if (!probe.ok) {
      hostWarning = probe.reason;
      if (!workerCommand && !workerFn)
        return { hostWarning, ok: false, reason: probe.reason };
    }
    parallelClaimed = !workerCommand && !workerFn;
    maxConcurrent = capacity();
  } else if (workerFn || workerCommand) {
    parallelClaimed = true;
    maxConcurrent = capacity();
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
    await runReadyBatch({
      batch,
      host,
      maxConcurrent,
      model,
      repoRoot,
      results,
      slug,
      state,
      workerCommand,
      workerFn,
    });
  }

  let state = loadState({ repoRoot, slug });
  const integrated = runIntegratedAcceptance({
    command: parsed.integratedAcceptance,
    repoRoot,
    slug,
  });
  if (integrated.exitCode !== 0) {
    return {
      hostWarning,
      integratedAcceptance: integrated,
      maxConcurrent,
      ok: false,
      parallelClaimed,
      reason: "integrated acceptance failed",
      results,
      state,
      status: "failed",
    };
  }

  state = loadState({ repoRoot, slug });
  const finalStatus = finalizeRunStatus({ state, tasks });
  return {
    hostWarning,
    maxConcurrent,
    ok: finalStatus.ok,
    parallelClaimed,
    results,
    state,
    status: finalStatus.status,
  };
};

export const runSequentialForTests = async ({
  repoRoot,
  slug,
  parsed,
  initiativeRelative,
  workerFn,
}) => {
  const result = await runInitiative({
    initiativeRelative,
    parsed,
    repoRoot,
    slug,
    workerFn,
  });
  if (!result.ok)
    return {
      failed: result.status === "failed",
      ok: false,
      state: result.state,
    };
  return { ok: true, state: result.state };
};
