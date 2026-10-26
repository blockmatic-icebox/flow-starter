"use server";

import {
  confirmRequest,
  createDraftAndTriage,
  getDb,
  getRequest,
  recordPmReviewStarted,
  retryTriage,
  searchRequests,
  DispositionError,
  setDisposition,
  supportRequest,
} from "@repo/fi";
import type { FeatureRequestSource, SearchRequestsSort } from "@repo/fi";
import { cookies } from "next/headers";

const db = () => getDb();

export async function actionCreateDraftAndTriage(input: {
  title: string;
  description: string;
  source: FeatureRequestSource;
}): ReturnType<typeof createDraftAndTriage> {
  return await createDraftAndTriage({ db: db(), ...input });
}

export async function actionConfirmRequest(input: {
  requestId: string;
  problemStatement: string;
  intakeLinkedRequestId?: string | null;
}) {
  return await confirmRequest({ db: db(), ...input });
}

export async function actionSetDisposition(input: {
  requestId: string;
  disposition: "merge" | "monitor" | "decline" | "needs_discussion";
  dispositionRationale: string;
  mergeTargetId?: string | null;
}) {
  try {
    return await setDisposition({ db: db(), ...input });
  } catch (error) {
    if (error instanceof DispositionError)
      throw new Error(error.message, { cause: error });
    throw error;
  }
}

export async function actionRecordPmReview(input: { requestId: string }) {
  return await recordPmReviewStarted({ db: db(), ...input });
}

export async function actionSupportRequest(input: {
  requestId: string;
  supporterKey: string;
}) {
  return await supportRequest({ db: db(), ...input });
}

export async function actionGetRequest(input: { requestId: string }) {
  return await getRequest({ db: db(), ...input });
}

export async function actionSearchRequests(input: {
  query?: string;
  themeKey?: string;
  sort?: SearchRequestsSort;
  page?: number;
  pageSize?: number;
}) {
  return await searchRequests({ db: db(), pageSize: 25, ...input });
}

export async function actionRetryTriage(input: {
  requestId: string;
}): ReturnType<typeof retryTriage> {
  return await retryTriage({ db: db(), ...input });
}

export async function actionSupportWithCookie(input: { requestId: string }) {
  const cookieStore = await cookies();
  let supporterKey = cookieStore.get("supporter_id")?.value;
  if (!supporterKey) {
    supporterKey = `web-${crypto.randomUUID()}`;
    cookieStore.set("supporter_id", supporterKey, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
  }
  return await supportRequest({
    db: db(),
    requestId: input.requestId,
    supporterKey,
  });
}
