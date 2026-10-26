import { featureRequest } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { eq } from "drizzle-orm";

import type { FeatureRequestSource } from "../schemas/feature-request-source";
import { classifyThemeDeterministic } from "../theme/classify-deterministic";
import { themeLabelForKey } from "../theme/registry";
import { triageModelLabel } from "../triage/harness-helpers";
import { runTriageHarness } from "../triage/run-triage-harness";
import type { TriageHarnessResult } from "../triage/types";
import {
  applyHarnessToRequest,
  insertDraft,
  insertDuplicateCandidates,
  loadPublishedCatalog,
} from "./persist-triage-result";

const buildFailedHarness = ({
  description,
  detail,
  title,
}: {
  description: string;
  detail: string;
  title: string;
}): TriageHarnessResult => {
  const themeFast = classifyThemeDeterministic({ description, title });
  const themeLabel = themeLabelForKey(themeFast.themeKey);
  return {
    decisionBrief: `Triage could not complete (${detail}). Manual review recommended.`,
    degraded: true,
    dispositionSuggestion: null,
    duplicateCandidates: [],
    problemStatement: description.trim().slice(0, 500),
    recommendedIntakeLinkId: null,
    themeKey: themeFast.themeKey,
    themeLabel,
    themeRationale: `Theme ${themeLabel} from deterministic routing.`,
    triageConfidence: themeFast.confidence,
    triageSteps: {
      degraded: true,
      duration_ms: 0,
      model: triageModelLabel(true),
      needs_ai_review: true,
      steps: [
        { detail, name: "triage_harness" },
        { detail: "failed synthesis", name: "synthesize" },
      ],
      version: 1,
    },
  };
};

export const createDraftAndTriage = async ({
  db,
  title,
  description,
  source,
}: {
  db: AppDatabase;
  title: string;
  description: string;
  source: FeatureRequestSource;
}) => {
  const draft = await insertDraft({ db, description, source, title });
  const published = await loadPublishedCatalog({ db });

  let harness: TriageHarnessResult;
  try {
    harness = await runTriageHarness({
      description,
      published,
      source,
      title,
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "triage harness failed";
    harness = buildFailedHarness({ description, detail, title });
  }

  await applyHarnessToRequest({ db, harness, requestId: draft.id });
  await insertDuplicateCandidates({ db, harness, requestId: draft.id });

  const [updated] = await db
    .select()
    .from(featureRequest)
    .where(eq(featureRequest.id, draft.id));

  return {
    harness,
    request: updated,
  };
};
