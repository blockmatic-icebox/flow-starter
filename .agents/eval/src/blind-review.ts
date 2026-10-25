import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { runEvalDir } from "./paths.ts";
import type {
  DimensionId,
  DimensionScore,
  DimensionScoreValue,
} from "./types.ts";

export type BlindReviewSheet = {
  scenarioId: string;
  reviewer: string;
  rubricVersion: string;
  scores: Partial<Record<DimensionId, 0 | 1 | 2 | 3 | 4>>;
  conflictHandling?: "pass" | "fail";
};

const subjectiveIds = new Set<DimensionId>([
  "intent-fidelity",
  "workflow-judgment",
  "context-management",
]);

export const loadBlindReview = ({
  runId,
  scenarioId,
}: {
  runId: string;
  scenarioId: string;
}) => {
  const filePath = path.join(
    runEvalDir(runId),
    "blind-reviews",
    `${scenarioId}.json`
  );
  if (!existsSync(filePath)) return undefined;
  return JSON.parse(readFileSync(filePath, "utf-8")) as BlindReviewSheet;
};

export const mergeBlindScores = ({
  base,
  blind,
}: {
  base: DimensionScore[];
  blind?: BlindReviewSheet;
}) => {
  if (!blind) return base;
  return base.map((s) => {
    if (!subjectiveIds.has(s.id)) return s;
    const score = blind.scores[s.id];
    if (score === undefined) return s;
    return {
      ...s,
      origin: "evaluator-inference" as const,
      score: score as DimensionScoreValue,
    };
  });
};
