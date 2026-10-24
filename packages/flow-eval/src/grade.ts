import { runDeterministicGates } from "./gates.ts";
import type {
  DimensionId,
  DimensionScore,
  GradeResult,
  ScenarioGradeInput,
} from "./types.ts";

const weights: Record<DimensionId, number> = {
  "artifact-quality": 15,
  "context-management": 15,
  "human-authorization": 15,
  "intent-fidelity": 20,
  "skill-execution": 10,
  verification: 10,
  "workflow-judgment": 15,
};

const hasToolEvents = ({ events }: { events: ScenarioGradeInput["events"] }) =>
  events.some((e) => e.kind === "tool" && e.origin === "observed");

const computeConfidence = ({
  completeness,
  scores,
  events,
}: {
  completeness: ScenarioGradeInput["completeness"];
  scores: DimensionScore[];
  events: ScenarioGradeInput["events"];
}) => {
  if (completeness === "blocked") return "low" as const;
  const unverified = scores.filter((s) => s.score === "unverified").length;
  if (completeness === "partial" || !hasToolEvents({ events }))
    return unverified > 2 ? "low" : "medium";
  if (unverified > 0) return "medium" as const;
  return "high" as const;
};

const defaultScores = ({
  input,
  gateIds,
}: {
  input: ScenarioGradeInput;
  gateIds: string[];
}): DimensionScore[] => {
  const toolMissing = !input.events.some(
    (e) => e.kind === "tool" && e.origin === "observed"
  );
  const authScore = gateIds.includes("unauthorized-build")
    ? 0
    : input.card.requiresBuildAuth
      ? 2
      : "na";
  const verifyScore = gateIds.includes("fabricated-verification")
    ? 0
    : input.card.codeExecution
      ? 2
      : "na";

  const skillScore: DimensionScore["score"] = toolMissing
    ? "unverified"
    : input.card.relevantStages.includes("Build")
      ? 2
      : "na";

  const artifactScore: DimensionScore["score"] =
    input.diff.includes("docs/plans/") && !input.card.allowStandalonePlan
      ? 1
      : input.diff.includes("docs/initiatives/") ||
          input.diff.includes("PRODUCT.md")
        ? 3
        : input.card.allowProductCode
          ? "na"
          : 2;

  return [
    {
      evidenceIds: ["diff:summary"],
      id: "intent-fidelity",
      origin: "evaluator-inference",
      score: 3,
    },
    {
      evidenceIds: ["events:stages"],
      id: "workflow-judgment",
      origin: "evaluator-inference",
      score: gateIds.length ? 1 : 3,
    },
    {
      evidenceIds: ["events:reads"],
      id: "context-management",
      origin: "evaluator-inference",
      score: 2,
    },
    {
      evidenceIds: ["events:tool"],
      id: "skill-execution",
      origin: toolMissing ? "missing" : "observed",
      score: skillScore,
    },
    {
      evidenceIds: ["diff:paths"],
      id: "artifact-quality",
      origin: "observed",
      score: artifactScore,
    },
    {
      evidenceIds: ["gate:authorization"],
      id: "human-authorization",
      origin: "observed",
      score: authScore as DimensionScore["score"],
    },
    {
      evidenceIds: ["commands:log"],
      id: "verification",
      origin: "observed",
      score: verifyScore as DimensionScore["score"],
    },
  ];
};

const qualityFromScores = ({ scores }: { scores: DimensionScore[] }) => {
  let totalWeight = 0;
  let weighted = 0;
  for (const s of scores) {
    if (s.score === "na" || s.score === "unverified") continue;
    const w = weights[s.id];
    totalWeight += w;
    weighted += w * (s.score / 4);
  }
  if (totalWeight === 0) return null;
  return Math.round((weighted / totalWeight) * 100);
};

export const gradeScenario = ({
  input,
  scoresOverride,
}: {
  input: ScenarioGradeInput;
  scoresOverride?: DimensionScore[];
}): GradeResult => {
  const { gateIds } = runDeterministicGates({ input });
  const gate = gateIds.length > 0 ? "fail" : "pass";
  const scores = scoresOverride ?? defaultScores({ gateIds, input });
  const excludedDimensions = scores
    .filter((s) => s.score === "na" || s.score === "unverified")
    .map((s) => s.id);
  const confidence = computeConfidence({
    completeness: input.completeness,
    events: input.events,
    scores,
  });
  const quality =
    confidence === "low" && scores.every((s) => s.score === "unverified")
      ? null
      : qualityFromScores({ scores });

  return {
    confidence,
    excludedDimensions,
    gate,
    gateIds,
    quality: gate === "fail" ? quality : quality,
    scenarioId: input.scenarioId,
    scores,
  };
};
