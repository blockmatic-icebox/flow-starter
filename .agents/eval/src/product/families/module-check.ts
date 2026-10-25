import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

import type { AcceptanceFamily } from "../../generation/types.ts";
import { repoRoot } from "../../paths.ts";
import type { CaseEvidence } from "../types.ts";

const contractRunner = `
import { pathToFileURL } from "node:url";
const modPath = process.env.FLOW_EVAL_CONTRACT;
if (!modPath) throw new Error("missing FLOW_EVAL_CONTRACT");
const mod = await import(pathToFileURL(modPath).href);
if (typeof mod.runAcceptance !== "function")
  throw new Error("runAcceptance missing");
await mod.runAcceptance();
`;

const runContractScript = ({
  modulePath,
  worktreePath,
}: {
  modulePath: string;
  worktreePath: string;
}) =>
  spawnSync(
    "pnpm",
    ["exec", "tsx", "--input-type=module", "-e", contractRunner],
    {
      cwd: repoRoot,
      encoding: "utf-8",
      env: {
        ...process.env,
        FLOW_EVAL_CONTRACT: modulePath,
        FLOW_EVAL_WORKTREE: worktreePath,
      },
      stdio: "pipe",
      timeout: 60_000,
    }
  );

export const runFamilyModuleCheck = ({
  caseId,
  engineeringOnly = false,
  evaluatedSha,
  expectedRelativePath,
  family,
  runId,
  worktreePath,
}: {
  caseId: string;
  engineeringOnly?: boolean;
  evaluatedSha: string;
  expectedRelativePath: string;
  family: AcceptanceFamily;
  runId: string;
  worktreePath: string;
}): CaseEvidence => {
  const modulePath = path.join(worktreePath, expectedRelativePath);
  if (!existsSync(modulePath))
    return {
      actual: `missing ${expectedRelativePath}`,
      caseId,
      environment: "local",
      evaluatedSha,
      evidenceRef: `${runId}/evidence/commands.json#${caseId}`,
      executionMethod: `contract:${family}`,
      exitCode: 1,
      expected: engineeringOnly
        ? "contract module present"
        : "contract acceptance passes",
      origin: "live",
      requirementId: engineeringOnly ? `${family}-ENG` : `${family}-CORE`,
      status: "failed",
    };

  if (engineeringOnly)
    return {
      actual: "contract module present",
      caseId,
      environment: "local",
      evaluatedSha,
      evidenceRef: `${runId}/evidence/commands.json#${caseId}`,
      executionMethod: `contract:${family}`,
      exitCode: 0,
      expected: "contract module present",
      origin: "live",
      requirementId: `${family}-ENG`,
      status: "passed",
    };

  const result = runContractScript({ modulePath, worktreePath });
  const status = result.status === 0 ? "passed" : "failed";
  return {
    actual: (result.stderr || result.stdout || "").slice(0, 500),
    caseId,
    environment: "local",
    evaluatedSha,
    evidenceRef: `${runId}/evidence/commands.json#${caseId}`,
    executionMethod: `contract:${family}`,
    exitCode: result.status,
    expected: "runAcceptance() succeeds",
    origin: "live",
    requirementId: `${family}-CORE`,
    status,
  };
};
