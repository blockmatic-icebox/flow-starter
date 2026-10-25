import { writeProductEvalArtifacts } from "./persist.ts";
import { evaluateReadinessWithDatabase } from "./readiness-isolated.ts";
import { runRemediationLoop } from "./remediate.ts";
import type { RepairExecutor } from "./remediate.ts";

export const runStressEvaluation = async ({
  runId,
  maxRemediationCycles = 3,
  caseIds,
  repairExecutor,
  workDir,
}: {
  runId: string;
  maxRemediationCycles?: number;
  caseIds?: string[];
  repairExecutor?: RepairExecutor;
  workDir?: string;
}) => {
  const loop = await runRemediationLoop({
    caseIds,
    evaluate: ({ runId: cycleRunId }) =>
      evaluateReadinessWithDatabase({ caseIds, runId: cycleRunId }),
    maxRemediationCycles,
    repairExecutor,
    runId,
    workDir,
  });

  writeProductEvalArtifacts({
    findings: loop.findings,
    readiness: loop.readiness,
    runId,
  });

  return {
    cycles: loop.cyclesApplied,
    cyclesApplied: loop.cyclesApplied,
    findings: loop.findings,
    ok: loop.ok,
    readiness: loop.readiness,
    remediation: loop.remediation,
    status:
      loop.readiness.releaseVerdict === "READY"
        ? "completed"
        : loop.cyclesApplied >= maxRemediationCycles
          ? "partial"
          : "failed",
    stopReason: loop.stopReason,
  };
};
