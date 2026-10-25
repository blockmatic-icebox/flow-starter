import type {
  GradeResult,
  HostFinalizationOutcome,
  HostJobStatus,
} from "./types.ts";

const terminalStatuses = new Set<HostJobStatus>([
  "complete",
  "failed",
  "blocked",
  "timed-out",
  "cancelled",
]);

export const expectedHostJobCount = ({
  jobCount,
  repetition,
  scenarioIds,
}: {
  jobCount: number;
  repetition: number;
  scenarioIds: string[];
}) => (jobCount > 0 ? jobCount : scenarioIds.length * repetition);

export const deriveHostFinalizationOutcome = ({
  expectedGrades,
  grades,
  incompleteJobLabels,
  jobs,
}: {
  expectedGrades: number;
  grades: GradeResult[];
  incompleteJobLabels: string[];
  jobs: { status: HostJobStatus }[];
}): HostFinalizationOutcome => {
  if (jobs.length === 0)
    return {
      ok: false,
      outcome: "blocked",
      reason: "no scheduled jobs",
    };

  const incomplete = jobs.filter((j) => !terminalStatuses.has(j.status));
  const terminalFailed = jobs.filter((j) => j.status === "failed");

  if (grades.length === 0) {
    if (incomplete.length > 0)
      return {
        ok: false,
        outcome: "partial",
        reason: `no completed jobs; still running: ${incompleteJobLabels.join(", ")}`,
      };
    return {
      ok: false,
      outcome: "blocked",
      reason:
        terminalFailed.length > 0
          ? "no gradable jobs; campaign ended with failed jobs"
          : "no gradable jobs; campaign blocked or produced no evidence",
    };
  }

  const gateFailed = grades.some((g) => g.gate === "fail");
  if (gateFailed)
    return {
      ok: false,
      outcome: "failed",
      reason: "one or more scenarios failed evaluation gates",
    };

  if (incomplete.length > 0 || grades.length < expectedGrades)
    return {
      ok: false,
      outcome: "partial",
      reason:
        incomplete.length > 0
          ? `incomplete jobs: ${incompleteJobLabels.join(", ")}`
          : `expected ${expectedGrades} grades, received ${grades.length}`,
    };

  if (terminalFailed.length > 0)
    return {
      ok: false,
      outcome: "failed",
      reason: "one or more jobs failed before completion",
    };

  const blockedOrWorse = jobs.filter(
    (j) =>
      j.status === "blocked" ||
      j.status === "timed-out" ||
      j.status === "cancelled"
  );
  if (blockedOrWorse.length > 0)
    return {
      ok: false,
      outcome: "partial",
      reason: "not all scheduled jobs completed successfully",
    };

  return {
    ok: true,
    outcome: "complete",
    reason: "all scheduled jobs completed and gates passed",
  };
};

export const allGradesOfficiallyEligible = ({
  grades,
}: {
  grades: GradeResult[];
}) => grades.length > 0 && grades.every((g) => g.officialEligible);
