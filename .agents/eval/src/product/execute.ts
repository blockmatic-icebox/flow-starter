import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

import {
  loadSubjectEnvForWorktree,
  readSubjectDatabaseUrl,
  subjectProcessEnv,
} from "../infrastructure/subject-env.ts";
import { repoRoot } from "../paths.ts";
import type { AllowlistedCase } from "./registry.ts";
import type { CaseEvidence, EvidenceStatus } from "./types.ts";

const dbAcceptanceRunnerPath = path.join(
  repoRoot,
  ".agents/eval/src/infrastructure/db-acceptance.ts"
);

const resolveExecutionCwd = ({
  caseDef,
  worktreePath,
}: {
  caseDef: AllowlistedCase;
  worktreePath?: string;
}) => {
  if (caseDef.execution === "runner") return repoRoot;
  return worktreePath ?? repoRoot;
};

const resolveExecutionEnv = ({
  caseDef,
  worktreePath,
}: {
  caseDef: AllowlistedCase;
  worktreePath?: string;
}) => {
  if (caseDef.execution === "runner" && worktreePath) {
    if (caseDef.caseId === "db-starter-persist")
      return loadSubjectEnvForWorktree({ worktreePath });
    return process.env;
  }
  if (worktreePath) {
    const databaseUrl = readSubjectDatabaseUrl(worktreePath);
    if (databaseUrl) return subjectProcessEnv({ databaseUrl, worktreePath });
  }
  return process.env;
};

export const runAllowlistedCase = ({
  caseDef,
  evaluatedSha,
  runId,
  worktreePath,
}: {
  caseDef: AllowlistedCase;
  evaluatedSha: string;
  runId: string;
  worktreePath?: string;
}) => {
  const executionCwd = resolveExecutionCwd({ caseDef, worktreePath });
  const runnerOwned = caseDef.execution === "runner";
  const env = resolveExecutionEnv({ caseDef, worktreePath });

  if (
    caseDef.caseId === "db-starter-persist" &&
    worktreePath &&
    !env?.FLOW_EVAL_WORKTREE
  ) {
    return {
      actual: "missing subject DATABASE_URL or FLOW_EVAL_WORKTREE",
      caseId: caseDef.caseId,
      environment: "local",
      evaluatedSha,
      evidenceRef: `${runId}/evidence/commands.json#${caseDef.caseId}`,
      executionCwd,
      executionMethod: caseDef.command,
      exitCode: 2,
      expected: caseDef.expected,
      origin: "live" as const,
      requirementId: caseDef.requirementIds[0] ?? "ENGINEERING",
      runnerOwned,
      status: "blocked" as EvidenceStatus,
    } satisfies CaseEvidence;
  }

  if (
    caseDef.caseId === "db-starter-persist" &&
    !existsSync(dbAcceptanceRunnerPath)
  ) {
    return {
      actual: `runner script missing: ${dbAcceptanceRunnerPath}`,
      caseId: caseDef.caseId,
      environment: "local",
      evaluatedSha,
      evidenceRef: `${runId}/evidence/commands.json#${caseDef.caseId}`,
      executionCwd,
      executionMethod: caseDef.command,
      exitCode: 2,
      expected: caseDef.expected,
      origin: "live" as const,
      requirementId: caseDef.requirementIds[0] ?? "ENGINEERING",
      runnerOwned,
      status: "failed" as EvidenceStatus,
    } satisfies CaseEvidence;
  }

  const result = spawnSync(caseDef.command, {
    cwd: executionCwd,
    encoding: "utf-8",
    env: env ?? process.env,
    shell: true,
    stdio: "pipe",
    timeout: 600_000,
  });
  const status: EvidenceStatus = result.status === 0 ? "passed" : "failed";
  return {
    actual: (result.stderr || result.stdout || "").slice(0, 500),
    caseId: caseDef.caseId,
    environment: "local",
    evaluatedSha,
    evidenceRef: `${runId}/evidence/commands.json#${caseDef.caseId}`,
    executionCwd,
    executionMethod: caseDef.command,
    exitCode: result.status,
    expected: caseDef.expected,
    origin: "live" as const,
    requirementId: caseDef.requirementIds[0] ?? "ENGINEERING",
    runnerOwned,
    status,
  } satisfies CaseEvidence;
};
