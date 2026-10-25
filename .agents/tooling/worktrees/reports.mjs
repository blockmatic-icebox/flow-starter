import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const questionReportPath = ({ repoRoot, slug, taskId }) =>
  path.join(repoRoot, ".worktrees", "reports", slug, `${taskId}.json`);

export const writeQuestionReport = ({
  repoRoot,
  slug,
  taskId,
  summary,
  evidencePaths = [],
}) => {
  const file = questionReportPath({ repoRoot, slug, taskId });
  mkdirSync(path.dirname(file), { recursive: true });
  const body = {
    evidencePaths,
    summary: summary.trim(),
    taskId,
    writtenAt: new Date().toISOString(),
  };
  writeFileSync(file, `${JSON.stringify(body, null, 2)}\n`, "utf-8");
  return { ok: true, path: file };
};

export const loadQuestionReport = ({ repoRoot, slug, taskId }) => {
  const file = questionReportPath({ repoRoot, slug, taskId });
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf-8"));
  } catch {
    return null;
  }
};
