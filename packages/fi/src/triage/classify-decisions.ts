import { experimental_decide } from "ai";
import type { Experimental_DecisionModel } from "ai";

import { getFiDecisionModel } from "../ai/gateway";
import type { classifyThemeDeterministic } from "../theme/classify-deterministic";
import { themeRegistry } from "../theme/registry";
import type { ThemeKey } from "../theme/registry";
import type { ClassificationResult } from "./types";

const themeCriteria = Object.fromEntries(
  Object.entries(themeRegistry).map(([key, value]) => [key, value.description])
) as Record<ThemeKey, string>;

export const classifyDecisions = async ({
  title,
  description,
  source,
  candidates,
  themeFastPath,
}: {
  title: string;
  description: string;
  source: string;
  candidates: { id: string; score: number; title?: string }[];
  themeFastPath: ReturnType<typeof classifyThemeDeterministic>;
}): Promise<ClassificationResult> => {
  const model = getFiDecisionModel();
  const skipThemeJev =
    themeFastPath.skippedJev && themeFastPath.confidence >= 0.9;

  if (!model)
    return {
      degraded: true,
      isSolutionShaped: false,
      linkDuplicateId: null,
      themeKey: themeFastPath.themeKey,
      themeSkippedJev: true,
    };

  const linkCriteria: Record<string, string> = { none: "No strong duplicate" };
  for (const c of candidates.slice(0, 10))
    linkCriteria[c.id] = `${c.title} (score ${c.score.toFixed(2)})`;

  const questions: Record<
    string,
    {
      criteria: Record<string, string> | string[];
      instructions: string;
      type: "boolean" | "choice";
    }
  > = {
    is_solution_shaped: {
      criteria: ["Problem-first framing", "Solution prescription only"],
      instructions:
        "Is the submitter prescribing a solution before stating the problem?",
      type: "boolean",
    },
    link_duplicate: {
      criteria: linkCriteria,
      instructions: "Strongest duplicate link, if any",
      type: "choice",
    },
  };

  if (!skipThemeJev)
    questions.theme = {
      criteria: themeCriteria,
      instructions: "Best theme for this request",
      type: "choice",
    };

  try {
    const result = await experimental_decide({
      model: model as Experimental_DecisionModel,
      questions: questions as Parameters<
        typeof experimental_decide
      >[0]["questions"],
      state: [
        { text: `Title: ${title}\n\n${description}`, type: "text" },
        {
          type: "json",
          value: { candidates: candidates.slice(0, 10), source },
        },
      ],
    });

    const themeKey = skipThemeJev
      ? themeFastPath.themeKey
      : (((result.answers.theme as { choice?: string })?.choice as ThemeKey) ??
        themeFastPath.themeKey);

    const linkAnswer = result.answers.link_duplicate as { choice?: string };
    const linkId =
      linkAnswer?.choice && linkAnswer.choice !== "none"
        ? linkAnswer.choice
        : null;

    const boolAnswer = result.answers.is_solution_shaped as {
      value?: boolean;
    };

    return {
      degraded: false,
      isSolutionShaped: boolAnswer?.value ?? false,
      linkDuplicateId: linkId,
      themeKey: themeKey in themeRegistry ? themeKey : themeFastPath.themeKey,
      themeSkippedJev: skipThemeJev,
    };
  } catch {
    return {
      degraded: true,
      isSolutionShaped: false,
      linkDuplicateId: null,
      themeKey: themeFastPath.themeKey,
      themeSkippedJev: skipThemeJev,
    };
  }
};
