import { spawnSync } from "node:child_process";

import { repoRoot } from "../paths.ts";
import type { AllowlistedCase } from "./registry.ts";
import type { CaseEvidence, EvidenceStatus } from "./types.ts";

export const runAllowlistedCase = ({
  caseDef,
  evaluatedSha,
  runId,
}: {
  caseDef: AllowlistedCase;
  evaluatedSha: string;
  runId: string;
}) => {
  const cwd = caseDef.cwd === "repo" ? repoRoot : repoRoot;
  const result = spawnSync(caseDef.command, {
    cwd,
    encoding: "utf-8",
    env: process.env,
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
    executionMethod: caseDef.command,
    exitCode: result.status,
    expected: caseDef.expected,
    origin: "live" as const,
    requirementId: caseDef.requirementIds[0] ?? "ENGINEERING",
    status,
  } satisfies CaseEvidence;
};
