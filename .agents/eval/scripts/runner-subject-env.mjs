import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const RUNNER_SECRET_KEYS = new Set([
  "NEON_API_KEY",
  "NEON_PROJECT_ID",
  "PARENT_BRANCH_ID",
]);

export const readSubjectDatabaseUrl = (worktreePath) => {
  const file = path.join(worktreePath, ".env.local");
  if (!existsSync(file)) return null;
  for (const line of readFileSync(file, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("DATABASE_URL=")) continue;
    return trimmed.slice("DATABASE_URL=".length).trim();
  }
  return null;
};

export const subjectProcessEnv = ({ worktreePath }) => {
  const databaseUrl = readSubjectDatabaseUrl(worktreePath);
  const base = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !RUNNER_SECRET_KEYS.has(key))
  );
  if (!databaseUrl) return base;
  return {
    ...base,
    DATABASE_TLS_INSECURE_LOCAL: "1",
    DATABASE_URL: databaseUrl,
    FLOW_EVAL_WORKTREE: worktreePath,
  };
};

export const spawnEnvForCwd = ({ cwd }) => {
  if (!cwd) return process.env;
  if (readSubjectDatabaseUrl(cwd))
    return subjectProcessEnv({ worktreePath: cwd });
  return process.env;
};
