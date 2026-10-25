import { generateObject } from "ai";
import { z } from "zod";

import { getFiSynthesisModel } from "../ai/gateway";
import type { ThemeKey } from "../theme/registry";
import { themeLabelForKey } from "../theme/registry";

const synthesisSchema = z.object({
  decisionBrief: z.string().max(2000),
  dispositionSuggestion: z.string().max(500).nullable(),
  duplicateExplanations: z.array(
    z.object({
      explanation: z.string().max(500),
      requestId: z.string().uuid(),
    })
  ),
  problemStatement: z.string().max(500),
  themeRationale: z.string().max(500),
});

export const synthesizeArtifact = async ({
  title,
  description,
  source,
  themeKey,
  linkDuplicateId,
  isSolutionShaped,
  candidateSnippets,
}: {
  title: string;
  description: string;
  source: string;
  themeKey: ThemeKey;
  linkDuplicateId: string | null;
  isSolutionShaped: boolean;
  candidateSnippets: { id: string; title: string; score: number }[];
}) => {
  const model = getFiSynthesisModel();
  const themeLabel = themeLabelForKey(themeKey);

  if (!model)
    return {
      decisionBrief: "Manual review recommended (degraded synthesis).",
      dispositionSuggestion: null,
      duplicateExplanations: [] as { explanation: string; requestId: string }[],
      problemStatement: description.trim().slice(0, 500),
      themeRationale: `Theme ${themeLabel} from deterministic routing.`,
    };

  const { object } = await generateObject({
    model,
    prompt: `You are a product triage assistant. Synthesize a decision-ready artifact.

Title: ${title}
Description: ${description}
Source: ${source}
Theme: ${themeKey} (${themeLabel})
Solution-shaped submitter: ${isSolutionShaped}
Recommended duplicate link: ${linkDuplicateId ?? "none"}
Candidates: ${JSON.stringify(candidateSnippets)}`,
    schema: synthesisSchema,
  });

  return object;
};
