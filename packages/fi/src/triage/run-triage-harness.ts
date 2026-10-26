import { classifyThemeDeterministic } from "../theme/classify-deterministic";
import { themeLabelForKey } from "../theme/registry";
import { classifyDecisions } from "./classify-decisions";
import {
  hasGatewayKey,
  mergeDuplicateExplanations,
  resolveDegraded,
  triageModelLabel,
} from "./harness-helpers";
import { retrieveLexicalCandidates } from "./retrieve-candidates";
import {
  isDegradedSynthesisBrief,
  synthesizeArtifact,
} from "./synthesize-artifact";
import type { TriageHarnessResult } from "./types";

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

  const gatewayMissing = !hasGatewayKey();
  let degraded = gatewayMissing;

  const classification = await classifyDecisions({
    candidates,
    description,
    source,
    themeFastPath: themeFast,
    title,
  });

  degraded = resolveDegraded({
    classificationDegraded: classification.degraded,
    gatewayMissing: degraded,
  });

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

  if (isDegradedSynthesisBrief(synthesis.decisionBrief)) degraded = true;

  steps.push({
    detail: degraded ? "degraded synthesis" : "generateObject",
    name: "synthesize",
  });

  const duplicateCandidates = mergeDuplicateExplanations(
    candidates,
    synthesis.duplicateExplanations
  );

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
      model: triageModelLabel(degraded),
      needs_ai_review: degraded,
      steps,
      version: 1,
    },
  };
};
