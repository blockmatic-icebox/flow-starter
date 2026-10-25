import { writeProductEvalArtifacts } from "./persist.ts";
import { evaluateReadiness } from "./readiness.ts";
import type { StressFinding } from "./types.ts";

export const runStressEvaluation = ({
  runId,
  maxRemediationCycles = 3,
  caseIds,
}: {
  runId: string;
  maxRemediationCycles?: number;
  caseIds?: string[];
}) => {
  const remediation = [];
  let cycle = 0;
  let readiness = evaluateReadiness({
    caseIds,
    runId: `${runId}-cycle-${cycle}`,
  });
  let findings = findingsFromReadiness(readiness);

  while (
    readiness.releaseVerdict !== "READY" &&
    cycle < maxRemediationCycles &&
    findings.some((f) => f.severity === "P0" || f.severity === "P1")
  ) {
    remediation.push({
      cycle: cycle + 1,
      findings,
      readiness: readiness.releaseVerdict,
    });
    cycle += 1;
    readiness = evaluateReadiness({
      caseIds,
      runId: `${runId}-cycle-${cycle}`,
    });
    findings = findingsFromReadiness(readiness);
  }

  writeProductEvalArtifacts({ findings, readiness, runId });

  return {
    cycles: cycle,
    findings,
    ok: readiness.releaseVerdict === "READY",
    readiness,
    remediation,
    status:
      readiness.releaseVerdict === "READY"
        ? "completed"
        : cycle >= maxRemediationCycles
          ? "partial"
          : "failed",
  };
};

const findingsFromReadiness = (
  readiness: ReturnType<typeof evaluateReadiness>
): StressFinding[] =>
  readiness.evidence
    .filter((row) => row.status === "failed")
    .map((row, index) => ({
      confidence: "high" as const,
      expected: row.expected,
      evidence: [row.evidenceRef],
      findingId: `F-EVID-${index + 1}`,
      observed: row.actual,
      reproduction: [row.executionMethod],
      requirementId: row.requirementId,
      severity: "P1" as const,
    }));
