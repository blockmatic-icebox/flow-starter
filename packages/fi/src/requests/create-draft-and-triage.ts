import { featureRequest } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { eq } from "drizzle-orm";

import type { FeatureRequestSource } from "../schemas/feature-request-source";
import { runTriageHarness } from "../triage/run-triage-harness";
import {
  applyHarnessToRequest,
  insertDraft,
  insertDuplicateCandidates,
  loadPublishedCatalog,
} from "./persist-triage-result";

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

  const harness = await runTriageHarness({
    description,
    published,
    source,
    title,
  });

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
