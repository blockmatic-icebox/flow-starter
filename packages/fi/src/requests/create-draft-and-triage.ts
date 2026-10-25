import { featureRequest, featureRequestDuplicateCandidate } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { eq } from "drizzle-orm";

import { runTriageHarness } from "../triage/run-triage-harness";

export const createDraftAndTriage = async ({
  db,
  title,
  description,
  source,
}: {
  db: AppDatabase;
  title: string;
  description: string;
  source: "customer" | "prospect" | "support" | "internal";
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

  const published = await db
    .select({
      description: featureRequest.description,
      id: featureRequest.id,
      title: featureRequest.title,
    })
    .from(featureRequest)
    .where(eq(featureRequest.status, "published"));

  const harness = runTriageHarness({
    description,
    published,
    title,
  });

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
    .where(eq(featureRequest.id, draft.id));

  if (harness.duplicateCandidates.length > 0)
    await db.insert(featureRequestDuplicateCandidate).values(
      harness.duplicateCandidates.map((c) => ({
        candidateRequestId: c.id,
        explanation: c.explanation,
        requestId: draft.id,
        score: c.score,
      }))
    );

  const [updated] = await db
    .select()
    .from(featureRequest)
    .where(eq(featureRequest.id, draft.id));

  return {
    harness,
    request: updated,
  };
};
