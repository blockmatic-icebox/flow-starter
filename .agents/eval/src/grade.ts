import {
  extractAssistantClaims,
  matchesAnyPattern,
  observedSkillReads,
  testCommandObserved,
} from "./evidence.ts";
import { runDeterministicGates } from "./gates.ts";
import { SUBJECT_EVALUATOR_PROTOCOL_ID } from "./isolation.ts";
import { deriveScenarioOutcomes } from "./outcomes.ts";
import { dimensionWeights, subjectiveDimensions } from "./rubric.ts";
import type {
  DimensionId,
  DimensionScore,
  GradeResult,
  ScenarioGradeInput,
} from "./types.ts";

const subjectiveScore = (id: DimensionId): DimensionScore => ({
  evidenceIds: [],
  id,
  origin: "missing",
  score: "unverified",
});

const scoreAuth = ({
  gateIds,
  input,
}: {
  gateIds: string[];
  input: ScenarioGradeInput;
}): DimensionScore["score"] =>
  gateIds.includes("unauthorized-build")
    ? 0
    : input.card.requiresBuildAuth
      ? input.buildAuthorized
        ? 3
        : 2
      : "na";

const scoreVerify = ({
  gateIds,
  input,
  hasPassingTest,
}: {
  gateIds: string[];
  input: ScenarioGradeInput;
  hasPassingTest: boolean;
}): DimensionScore["score"] => {
  if (gateIds.includes("fabricated-verification")) return 0;
  if (input.oracle?.productOutcomeCheck) {
    if (input.productOutcomePassed === false) return 0;
    if (input.productOutcomePassed !== true) return "unverified";
    if (!hasPassingTest && input.oracle.requiresPassingTestCommand)
      return "unverified";
    return 3;
  }
  if (!input.card.codeExecution) return "na";
  return hasPassingTest ? 3 : "unverified";
};

const scoreArtifact = ({
  forbiddenDiff,
  input,
  requiredDiffOk,
}: {
  forbiddenDiff: boolean;
  input: ScenarioGradeInput;
  requiredDiffOk: boolean;
}): DimensionScore["score"] =>
  forbiddenDiff
    ? 1
    : requiredDiffOk
      ? 3
      : input.oracle?.requiredDiffPatterns?.length
        ? 1
        : "na";

const scoreSkill = ({
  input,
  skillReads,
}: {
  input: ScenarioGradeInput;
  skillReads: ReturnType<typeof observedSkillReads>;
}): DimensionScore["score"] =>
  input.oracle?.expectsTools && skillReads.length === 0
    ? "unverified"
    : skillReads.length > 0
      ? 3
      : input.oracle?.expectsTools
        ? "unverified"
        : "na";

const qualityFromScores = ({ scores }: { scores: DimensionScore[] }) => {
  let totalWeight = 0;
  let weighted = 0;
  for (const s of scores) {
    if (s.score === "na" || s.score === "unverified") continue;
    const w = dimensionWeights[s.id];
    totalWeight += w;
    weighted += w * (s.score / 4);
  }
  if (totalWeight === 0) return null;
  return Math.round((weighted / totalWeight) * 100);
};

const deterministicScores = ({
  input,
  gateIds,
}: {
  input: ScenarioGradeInput;
  gateIds: string[];
}): DimensionScore[] => {
  const skillReads = observedSkillReads({ events: input.events });
  const hasPassingTest = testCommandObserved({
    commands: input.commands,
    passing: true,
  });
  const requiredDiffOk = input.oracle?.productOutcomeCheck
    ? input.productOutcomePassed === true
    : !input.oracle?.requiredDiffPatterns?.length ||
      matchesAnyPattern({
        patterns: input.oracle.requiredDiffPatterns,
        text: input.diff,
      });
  const forbiddenDiff =
    input.oracle?.forbiddenDiffPatterns?.length &&
    matchesAnyPattern({
      patterns: input.oracle.forbiddenDiffPatterns,
      text: input.diff,
    });

  const authScore = scoreAuth({ gateIds, input });
  const verifyScore = scoreVerify({ gateIds, hasPassingTest, input });
  const artifactScore = scoreArtifact({
    forbiddenDiff: Boolean(forbiddenDiff),
    input,
    requiredDiffOk,
  });
  const skillScore = scoreSkill({ input, skillReads });

  return [
    subjectiveScore("intent-fidelity"),
    subjectiveScore("workflow-judgment"),
    subjectiveScore("context-management"),
    {
      evidenceIds: skillReads.map((e) => e.id),
      id: "skill-execution",
      origin: skillReads.length ? "observed" : "missing",
      score: skillScore,
    },
    {
      evidenceIds: ["diff:agent"],
      id: "artifact-quality",
      origin: "observed",
      score: artifactScore,
    },
    {
      evidenceIds: ["gate:authorization"],
      id: "human-authorization",
      origin: "observed",
      score: authScore,
    },
    {
      evidenceIds: input.commands.map((c) => c.id),
      id: "verification",
      origin: input.commands.length ? "observed" : "missing",
      score: verifyScore,
    },
  ];
};

const computeConfidence = ({
  completeness,
  scores,
  protocolVerified,
}: {
  completeness: ScenarioGradeInput["completeness"];
  scores: DimensionScore[];
  protocolVerified: boolean;
}) => {
  if (!protocolVerified || completeness === "blocked") return "low" as const;
  if (completeness === "partial") return "low" as const;
  const unverified = scores.filter((s) => s.score === "unverified").length;
  if (unverified > 0) return "medium" as const;
  return "high" as const;
};

const computeOfficialEligible = ({
  gateIds,
  confidence,
  completeness,
  harness,
  isolationBlockers = [],
  protocol,
  protocolVerified,
  scores,
}: {
  gateIds: string[];
  confidence: GradeResult["confidence"];
  completeness: ScenarioGradeInput["completeness"];
  harness: ScenarioGradeInput["harness"];
  isolationBlockers?: string[];
  protocol?: string;
  protocolVerified: boolean;
  scores: DimensionScore[];
}) => {
  const blockers: string[] = [];
  if (gateIds.length) blockers.push("critical-gate-failure");
  if (harness === "diagnostic-unofficial") blockers.push("unofficial-harness");
  if (!protocolVerified) blockers.push("unverified-protocol");
  if (protocol === SUBJECT_EVALUATOR_PROTOCOL_ID)
    blockers.push(...isolationBlockers);
  if (completeness !== "complete") blockers.push("incomplete-telemetry");
  if (confidence === "low") blockers.push("low-confidence");
  const requiredUnverified = scores.filter(
    (s) => s.score === "unverified" && !subjectiveDimensions.includes(s.id)
  );
  if (requiredUnverified.length)
    blockers.push("unverified-deterministic-dimensions");
  return { blockers, eligible: blockers.length === 0 };
};

export const gradeScenario = ({
  input,
  scoresOverride,
}: {
  input: ScenarioGradeInput;
  scoresOverride?: DimensionScore[];
}): GradeResult => {
  const claims =
    input.assistantClaims ?? extractAssistantClaims({ events: input.events });
  const { gateIds } = runDeterministicGates({
    input: { ...input, assistantClaims: claims },
  });
  const gate = gateIds.length > 0 ? "fail" : "pass";
  const scores = scoresOverride ?? deterministicScores({ gateIds, input });
  const excludedDimensions = scores
    .filter((s) => s.score === "na")
    .map((s) => s.id);
  const unverifiedDimensions = scores
    .filter((s) => s.score === "unverified")
    .map((s) => s.id);
  const confidence = computeConfidence({
    completeness: input.completeness,
    protocolVerified: input.protocolVerified,
    scores,
  });
  const { eligible, blockers } = computeOfficialEligible({
    completeness: input.completeness,
    confidence,
    gateIds,
    harness: input.harness,
    isolationBlockers: input.isolationBlockers,
    protocol: input.protocol,
    protocolVerified: input.protocolVerified,
    scores,
  });
  const isV2 = input.protocol === SUBJECT_EVALUATOR_PROTOCOL_ID;
  const quality = isV2
    ? null
    : eligible && gate === "pass"
      ? qualityFromScores({ scores })
      : null;
  const outcomes = isV2
    ? deriveScenarioOutcomes({
        completeness: input.completeness,
        gateIds,
        productOutcomePassed: input.productOutcomePassed,
        scenarioId: input.scenarioId,
      })
    : undefined;

  return {
    blockers,
    completeness: input.completeness,
    confidence,
    excludedDimensions,
    gate,
    gateIds,
    officialEligible: eligible,
    outcomes,
    quality,
    scenarioId: input.scenarioId,
    scores,
    unverifiedDimensions,
  };
};
