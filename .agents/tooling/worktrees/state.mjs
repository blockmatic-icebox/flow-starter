import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const TASK_STATUSES = new Set([
  "pending",
  "ready",
  "running",
  "verifying",
  "ready-to-integrate",
  "integrated",
  "blocked",
  "failed",
]);

export const statePath = ({ repoRoot, slug }) =>
  path.join(repoRoot, ".worktrees", "state", `${slug}.json`);

export const loadState = ({ repoRoot, slug }) => {
  const file = statePath({ repoRoot, slug });
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf-8"));
};

export const saveState = ({ repoRoot, slug, state }) => {
  const file = statePath({ repoRoot, slug });
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`, "utf-8");
};

export const initState = ({
  slug,
  sourceRevision,
  checkpointSha,
  checkpointPaths,
  tasks,
}) => ({
  checkpointPaths: checkpointPaths ?? [],
  checkpointSha: checkpointSha ?? null,
  integrationHead: sourceRevision ?? null,
  slug,
  sourceRevision,
  tasks: Object.fromEntries(
    tasks.map((task) => [
      task.id,
      {
        acceptance: null,
        baseSha: null,
        blockedReason: null,
        branch: null,
        error: null,
        id: task.id,
        integrationSha: null,
        mode: task.mode,
        status: "pending",
        wave: task.wave,
        workerPid: null,
        worktreePath: null,
      },
    ])
  ),
  updatedAt: new Date().toISOString(),
});

export const getTaskRecord = (state, taskId) => state.tasks[taskId];

export const setTaskStatus = (state, taskId, status, patch = {}) => {
  if (!TASK_STATUSES.has(status))
    throw new Error(`invalid task status: ${status}`);
  state.tasks[taskId] = {
    ...state.tasks[taskId],
    status,
    ...patch,
  };
  state.updatedAt = new Date().toISOString();
};

export const dependenciesIntegrated = (state, task) => {
  for (const dep of task.depends_on) {
    const record = getTaskRecord(state, dep);
    if (!record || record.status !== "integrated") return false;
  }
  return true;
};

export const readyTaskIds = (state, tasksById) => {
  const ready = [];
  for (const task of tasksById.values()) {
    const record = getTaskRecord(state, task.id);
    if (!record) continue;
    if (record.status !== "pending" && record.status !== "ready") continue;
    if (!dependenciesIntegrated(state, task)) continue;
    ready.push(task.id);
  }
  return ready;
};
