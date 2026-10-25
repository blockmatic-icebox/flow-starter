import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { assertSubjectDatabaseUrl } from "./connection-url.ts";

const RUNNER_SECRET_KEYS = [
  "NEON_API_KEY",
  "NEON_PROJECT_ID",
  "PARENT_BRANCH_ID",
] as const;

export const subjectEnvFilePath = (worktreePath: string) =>
  path.join(worktreePath, ".env.local");

export const writeSubjectEnvFile = ({
  databaseName,
  databaseUrl,
  worktreePath,
}: {
  databaseName: string;
  databaseUrl: string;
  worktreePath: string;
}) => {
  assertSubjectDatabaseUrl({ databaseName, url: databaseUrl });
  const lines = [
    `# flow-eval runner — do not commit`,
    `DATABASE_URL=${databaseUrl}`,
    "DATABASE_TLS_INSECURE_LOCAL=1",
    "",
  ];
  writeFileSync(subjectEnvFilePath(worktreePath), lines.join("\n"));
};

export const readSubjectDatabaseUrl = (worktreePath: string) => {
  const file = subjectEnvFilePath(worktreePath);
  if (!existsSync(file)) return undefined;
  for (const line of readFileSync(file, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("DATABASE_URL=")) continue;
    return trimmed.slice("DATABASE_URL=".length).trim();
  }
  return undefined;
};

export const loadSubjectEnvForWorktree = ({
  worktreePath,
}: {
  worktreePath: string;
}) => {
  const databaseUrl = readSubjectDatabaseUrl(worktreePath);
  if (!databaseUrl) return undefined;
  return subjectProcessEnv({ databaseUrl, worktreePath });
};

export const subjectProcessEnv = ({
  databaseUrl,
  worktreePath,
}: {
  databaseUrl: string;
  worktreePath: string;
}) => {
  const blocked = new Set<string>(RUNNER_SECRET_KEYS);
  const base = Object.fromEntries(
    Object.entries({
      ...process.env,
      DATABASE_TLS_INSECURE_LOCAL: "1",
      DATABASE_URL: databaseUrl,
      FLOW_EVAL_WORKTREE: worktreePath,
    }).filter(([key]) => !blocked.has(key))
  ) as NodeJS.ProcessEnv;
  return base;
};
