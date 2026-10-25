import { classifyThemeDeterministic } from "../theme/classify-deterministic";
import { themeLabelForKey } from "../theme/registry";
import { classifyDecisions } from "./classify-decisions";
import { retrieveLexicalCandidates } from "./retrieve-candidates";
import { synthesizeArtifact } from "./synthesize-artifact";
import type { DuplicateCandidate, TriageHarnessResult } from "./types";

const decisionModelId = () =>
  process.env.FI_DECISION_MODEL?.trim() || "typesafe-ai/jev";
const synthesisModelId = () =>
  process.env.FI_SYNTHESIS_MODEL?.trim() || "anthropic/claude-sonnet-4.6";

export const runTriageHarness = async ({
  title,
  description,
  source,
  published,
}: {
  title: string;
  description: string;
  source: string;
  published: { id: string; title: string; description: string }[];
}): Promise<TriageHarnessResult> => {
  const started = Date.now();
  const steps: TriageHarnessResult["triageSteps"]["steps"] = [];

  const candidates = retrieveLexicalCandidates({
    description,
    limit: 10,
    published,
    title,
  });
  steps.push({
    detail: `Lexical top ${candidates.length}`,
    name: "retrieve_candidates",
  });

  const themeFast = classifyThemeDeterministic({ description, title });
  steps.push({
    detail: themeFast.skippedJev ? "deterministic T1" : "needs Jev",
    method: themeFast.skippedJev ? "deterministic" : undefined,
    name: "classify_theme",
  });

  const gatewayKey = process.env.AI_GATEWAY_API_KEY?.trim();
  let degraded = !gatewayKey;

  const classification = await classifyDecisions({
    candidates,
    description,
    source,
    themeFastPath: themeFast,
    title,
  });

  if (classification.degraded) degraded = true;

  steps.push({
    detail: classification.degraded
      ? "degraded or skipped"
      : `theme=${classification.themeKey}, link=${classification.linkDuplicateId ?? "none"}`,
    name: "classify_decisions",
  });

  const { linkDuplicateId: linkId, themeKey } = classification;
  const themeLabel = themeLabelForKey(themeKey);

  const synthesis = await synthesizeArtifact({
    candidateSnippets: candidates.map((c) => ({
      id: c.id,
      score: c.score,
      title: c.title,
    })),
    description,
    isSolutionShaped: classification.isSolutionShaped,
    linkDuplicateId: linkId,
    source,
    themeKey,
    title,
  });

  if (!gatewayKey) degraded = true;

  steps.push({
    detail: degraded ? "degraded synthesis" : "generateObject",
    name: "synthesize",
  });

  const explanationById = new Map(
    synthesis.duplicateExplanations.map((e) => [e.requestId, e.explanation])
  );

  const duplicateCandidates: DuplicateCandidate[] = candidates.map((c) => ({
    ...c,
    explanation: explanationById.get(c.id) ?? c.explanation,
  }));

  const modelLabel = degraded
    ? "degraded"
    : `${decisionModelId()}+${synthesisModelId()}`;

  return {
    decisionBrief: synthesis.decisionBrief,
    degraded,
    dispositionSuggestion: synthesis.dispositionSuggestion,
    duplicateCandidates,
    problemStatement: synthesis.problemStatement,
    recommendedIntakeLinkId: linkId,
    themeKey,
    themeLabel,
    themeRationale: synthesis.themeRationale,
    triageConfidence: themeFast.confidence,
    triageSteps: {
      degraded,
      duration_ms: Date.now() - started,
      model: modelLabel,
      steps,
      version: 1,
    },
  };
};
