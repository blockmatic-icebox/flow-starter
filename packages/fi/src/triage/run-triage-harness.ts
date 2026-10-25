import { classifyThemeDeterministic } from "../theme/classify-deterministic.js";
import { themeLabelForKey } from "../theme/registry.js";
import { retrieveLexicalCandidates } from "./retrieve-candidates.js";

export const runTriageHarness = ({
  title,
  description,
  published,
}: {
  title: string;
  description: string;
  published: { id: string; title: string; description: string }[];
}) => {
  const started = Date.now();
  const candidates = retrieveLexicalCandidates({
    description,
    limit: 10,
    published,
    title,
  });

  const themeFast = classifyThemeDeterministic({ description, title });
  const degraded = !process.env.AI_GATEWAY_API_KEY?.trim();

  const { themeKey } = themeFast;
  const themeLabel = themeLabelForKey(themeKey);
  const linkId =
    candidates[0] && candidates[0].score > 0.35 ? candidates[0].id : null;

  const problemStatement = degraded
    ? description.trim()
    : `${title}: underlying need to be refined by synthesis model`;

  return {
    decisionBrief: degraded
      ? "Manual review recommended."
      : "PM brief pending synthesis model.",
    degraded,
    dispositionSuggestion: null,
    duplicateCandidates: candidates,
    problemStatement,
    recommendedIntakeLinkId: linkId,
    themeKey,
    themeLabel,
    themeRationale: degraded
      ? "Degraded triage (no AI gateway key)."
      : "Classified via harness.",
    triageConfidence: themeFast.confidence,
    triageSteps: {
      duration_ms: Date.now() - started,
      model: degraded ? "degraded" : "harness-partial",
      steps: [
        {
          detail: `Lexical top ${candidates.length}`,
          name: "retrieve_candidates",
        },
        {
          detail: themeFast.skippedJev ? "deterministic T1" : "needs Jev",
          name: "classify_theme",
        },
      ],
      version: 1,
    },
  };
};
