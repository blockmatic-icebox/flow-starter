import { featureRequest, featureRequestDuplicateCandidate } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { eq } from "drizzle-orm";

import { runTriageHarness } from "../triage/run-triage-harness";
import {
  applyHarnessToRequest,
  insertDuplicateCandidates,
  loadPublishedCatalog,
} from "./persist-triage-result";

export const retryTriage = async ({
  db,
  requestId,
}: {
  db: AppDatabase;
  requestId: string;
}) => {
  const [row] = await db
    .select()
    .from(featureRequest)
    .where(eq(featureRequest.id, requestId));

  if (!row) throw new Error("request not found");
  if (row.status !== "pending_confirm")
    throw new Error("retry applies only while pending confirm");

  const published = await loadPublishedCatalog({ db });
  const harness = await runTriageHarness({
    description: row.description,
    published,
    source: row.source,
    title: row.title,
  });

  await db
    .delete(featureRequestDuplicateCandidate)
    .where(eq(featureRequestDuplicateCandidate.requestId, requestId));

  await applyHarnessToRequest({ db, harness, requestId });
  await insertDuplicateCandidates({ db, harness, requestId });

  const [updated] = await db
    .select()
    .from(featureRequest)
    .where(eq(featureRequest.id, requestId));

  return { harness, request: updated };
};
