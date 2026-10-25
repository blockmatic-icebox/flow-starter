import type { AcceptanceFamily } from "../../generation/types.ts";
import type { RequirementRecord } from "../types.ts";
import { runFamilyModuleCheck } from "./module-check.ts";

export const acceptanceFamilies = (): AcceptanceFamily[] => [
  "support-tickets",
  "shift-scheduler",
  "inventory-ledger",
  "help-board",
  "work-orders",
  "library-holds",
];

export const isRegisteredFamily = (family: string) =>
  acceptanceFamilies().includes(family as AcceptanceFamily);

const familyModulePath: Record<AcceptanceFamily, string> = {
  "help-board": "packages/flow-eval-contract/help-board.mjs",
  "inventory-ledger": "packages/flow-eval-contract/inventory-ledger.mjs",
  "library-holds": "packages/flow-eval-contract/library-holds.mjs",
  "shift-scheduler": "packages/flow-eval-contract/shift-scheduler.mjs",
  "support-tickets": "packages/flow-eval-contract/support-tickets.mjs",
  "work-orders": "packages/flow-eval-contract/work-orders.mjs",
};

export const familyRequirements = ({
  family,
}: {
  family: AcceptanceFamily;
}): RequirementRecord[] => [
  {
    requirementId: `${family}-CORE`,
    releaseBlocking: true,
    source: `evaluator:${family}`,
    title: `${family} core contract`,
    verification: [{ caseId: `${family}-contract`, kind: "integration" }],
  },
  {
    requirementId: `${family}-ENG`,
    releaseBlocking: true,
    source: "engineering gates",
    title: `${family} engineering checks`,
    verification: [{ caseId: `${family}-engineering`, kind: "unit" }],
  },
];

export const runFamilyCase = ({
  caseId,
  evaluatedSha,
  family,
  runId,
  worktreePath,
}: {
  caseId: string;
  evaluatedSha: string;
  family: AcceptanceFamily;
  runId: string;
  worktreePath: string;
}) => {
  const rel = familyModulePath[family];
  if (caseId === `${family}-contract`)
    return runFamilyModuleCheck({
      caseId,
      evaluatedSha,
      expectedRelativePath: rel,
      family,
      runId,
      worktreePath,
    });
  if (caseId === `${family}-engineering`)
    return runFamilyModuleCheck({
      caseId,
      engineeringOnly: true,
      evaluatedSha,
      expectedRelativePath: rel,
      family,
      runId,
      worktreePath,
    });
  return {
    actual: `unknown case ${caseId}`,
    caseId,
    environment: "local",
    evaluatedSha,
    evidenceRef: `${runId}/evidence/commands.json#${caseId}`,
    executionMethod: "family-registry",
    exitCode: 1,
    expected: "registered case",
    origin: "fixture" as const,
    requirementId: `${family}-CORE`,
    status: "failed" as const,
  };
};
