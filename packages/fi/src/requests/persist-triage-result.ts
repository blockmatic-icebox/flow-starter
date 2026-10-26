import { featureRequest, featureRequestDuplicateCandidate } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { eq } from "drizzle-orm";

import type { FeatureRequestSource } from "../schemas/feature-request-source";
import type { TriageHarnessResult } from "../triage/types";

export const insertDraft = async ({
  db,
  description,
  source,
  title,
}: {
  db: AppDatabase;
  description: string;
  source: FeatureRequestSource;
  title: string;
}) => {
  const submittedAt = new Date();
  const [draft] = await db
    .insert(featureRequest)
    .values({
      description,
      source,
      status: "triaging",
      submittedAt,
      title,
    })
    .returning();

  if (!draft) throw new Error("failed to create draft request");
  return draft;
};

export const loadPublishedCatalog = ({ db }: { db: AppDatabase }) =>
  db
    .select({
      description: featureRequest.description,
      id: featureRequest.id,
      title: featureRequest.title,
    })
    .from(featureRequest)
    .where(eq(featureRequest.status, "published"));

export const applyHarnessToRequest = async ({
  db,
  harness,
  requestId,
}: {
  db: AppDatabase;
  harness: TriageHarnessResult;
  requestId: string;
}) => {
  const triageCompletedAt = new Date();
  await db
    .update(featureRequest)
    .set({
      decisionBrief: harness.decisionBrief,
      problemStatement: harness.problemStatement,
      status: "pending_confirm",
      themeKey: harness.themeKey,
      themeLabel: harness.themeLabel,
      themeRationale: harness.themeRationale,
      triageCompletedAt,
      triageConfidence: harness.triageConfidence,
      triageSteps: harness.triageSteps,
    })
    .where(eq(featureRequest.id, requestId));
};

export const insertDuplicateCandidates = async ({
  db,
  harness,
  requestId,
}: {
  db: AppDatabase;
  harness: TriageHarnessResult;
  requestId: string;
}) => {
  if (harness.duplicateCandidates.length === 0) return;
  await db.insert(featureRequestDuplicateCandidate).values(
    harness.duplicateCandidates.map((c) => ({
      candidateRequestId: c.id,
      explanation: c.explanation,
      requestId,
      score: c.score,
    }))
  );
};
