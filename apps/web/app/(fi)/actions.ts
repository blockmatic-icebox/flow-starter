"use server";

import {
  confirmRequest,
  createDraftAndTriage,
  getRequest,
  recordPmReviewStarted,
  searchRequests,
  setDisposition,
  supportRequest,
} from "@repo/fi";
import { cookies } from "next/headers";

import { fiDb } from "../../lib/fi-db";

export async function actionCreateDraftAndTriage(input: {
  title: string;
  description: string;
  source: "customer" | "prospect" | "support" | "internal";
}): ReturnType<typeof createDraftAndTriage> {
  return await createDraftAndTriage({ db: fiDb(), ...input });
}

export async function actionConfirmRequest(input: {
  requestId: string;
  problemStatement: string;
  intakeLinkedRequestId?: string | null;
}) {
  return await confirmRequest({ db: fiDb(), ...input });
}

export async function actionSetDisposition(input: {
  requestId: string;
  disposition: "merge" | "monitor" | "decline" | "needs_discussion";
  dispositionRationale: string;
  mergeTargetId?: string | null;
}) {
  return await setDisposition({ db: fiDb(), ...input });
}

export async function actionRecordPmReview(input: { requestId: string }) {
  return await recordPmReviewStarted({ db: fiDb(), ...input });
}

export async function actionSupportRequest(input: {
  requestId: string;
  supporterKey: string;
}) {
  return await supportRequest({ db: fiDb(), ...input });
}

export async function actionGetRequest(input: { requestId: string }) {
  return await getRequest({ db: fiDb(), ...input });
}

export async function actionSearchRequests(input: {
  query?: string;
  themeKey?: string;
}) {
  return await searchRequests({ db: fiDb(), limit: 50, ...input });
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
    db: fiDb(),
    requestId: input.requestId,
    supporterKey,
  });
}
