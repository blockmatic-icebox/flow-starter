import type { GradeResult } from "./types.ts";

export type OutcomeVerdict = "pass" | "fail" | "inconclusive";

export type BatchOutcomeSummary = {
  expectedGrades: number;
  infrastructure: OutcomeVerdict;
  methodology: OutcomeVerdict;
  overall: OutcomeVerdict;
  productAcceptance: OutcomeVerdict;
  receivedGrades: number;
  session: OutcomeVerdict;
};

export const summarizeBatchOutcomes = ({
  errors,
  grades,
  infrastructureFailure,
  official,
  repetition,
  scenarioIds,
}: {
  errors: string[];
  grades: GradeResult[];
  infrastructureFailure: boolean;
  official: boolean;
  repetition: number;
  scenarioIds: string[];
}): BatchOutcomeSummary => {
  const expectedGrades = scenarioIds.length * repetition;
  const receivedGrades = grades.length;

  const infrastructure: OutcomeVerdict =
    infrastructureFailure || errors.length > 0 ? "fail" : "pass";

  const session: OutcomeVerdict =
    expectedGrades === 0
      ? "inconclusive"
      : receivedGrades === expectedGrades
        ? "pass"
        : "fail";

  const methodology: OutcomeVerdict = (() => {
    if (session !== "pass") return "fail";
    if (!official) return "pass";
    return grades.every((g) => g.officialEligible) ? "pass" : "fail";
  })();

  const productAcceptance: OutcomeVerdict = (() => {
    const checked = grades.filter((g) => g.productOutcomePassed !== undefined);
    if (checked.length === 0) return "inconclusive";
    if (checked.some((g) => g.productOutcomePassed === false)) return "fail";
    return checked.every((g) => g.productOutcomePassed === true)
      ? "pass"
      : "inconclusive";
  })();

  const requiresProductEvidence = grades.some(
    (g) => g.productOutcomePassed !== undefined
  );

  const overall: OutcomeVerdict = (() => {
    if (infrastructure === "fail" || session === "fail") return "fail";
    if (official && methodology === "fail") return "fail";
    if (productAcceptance === "fail") return "fail";
    if (requiresProductEvidence && productAcceptance !== "pass") return "fail";
    if (
      methodology === "pass" &&
      infrastructure === "pass" &&
      session === "pass"
    )
      return "pass";
    return "inconclusive";
  })();

  return {
    expectedGrades,
    infrastructure,
    methodology,
    overall,
    productAcceptance,
    receivedGrades,
    session,
  };
};
