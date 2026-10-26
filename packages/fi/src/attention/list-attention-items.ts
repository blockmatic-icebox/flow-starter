import { featureRequest, featureRequestDuplicateCandidate } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import { isTriageDegraded } from "../triage/is-triage-degraded";
import type { TriageStepsPayload } from "../triage/types";

export type AttentionReason =
  | "awaiting_review"
  | "degraded_triage"
  | "unresolved_duplicate"
  | "pending_confirm_degraded";

export interface AttentionItem {
  requestId: string;
  title: string;
  reasons: AttentionReason[];
  detail: string;
  href: string;
  sortKey: number;
}

const reasonPriority: Record<AttentionReason, number> = {
  awaiting_review: 0,
  degraded_triage: 1,
  pending_confirm_degraded: 3,
  unresolved_duplicate: 2,
};

const mergeReason = (existing: AttentionReason[], next: AttentionReason) =>
  existing.includes(next) ? existing : [...existing, next];

export const listAttentionItems = async ({
  db,
  limit = 8,
}: {
  db: AppDatabase;
  limit?: number;
}) => {
  const cap = Math.min(Math.max(1, limit), 50);

  const publishedOpen = await db
    .select({
      decisionBrief: featureRequest.decisionBrief,
      id: featureRequest.id,
      publishedAt: featureRequest.publishedAt,
      title: featureRequest.title,
      triageSteps: featureRequest.triageSteps,
    })
    .from(featureRequest)
    .where(
      and(
        eq(featureRequest.status, "published"),
        isNull(featureRequest.disposition)
      )
    )
    .orderBy(desc(featureRequest.publishedAt));

  const pending = await db
    .select({
      id: featureRequest.id,
      intakeLinkedRequestId: featureRequest.intakeLinkedRequestId,
      title: featureRequest.title,
      triageSteps: featureRequest.triageSteps,
    })
    .from(featureRequest)
    .where(eq(featureRequest.status, "pending_confirm"));

  const pendingIds = pending.map((p) => p.id);
  const dupRows =
    pendingIds.length === 0
      ? []
      : await db
          .select({
            requestId: featureRequestDuplicateCandidate.requestId,
          })
          .from(featureRequestDuplicateCandidate)
          .where(
            inArray(featureRequestDuplicateCandidate.requestId, pendingIds)
          );

  const dupByRequest = new Map<string, number>();
  for (const row of dupRows) {
    dupByRequest.set(row.requestId, (dupByRequest.get(row.requestId) ?? 0) + 1);
  }

  const byId = new Map<string, AttentionItem>();

  for (const row of publishedOpen) {
    const steps = row.triageSteps as TriageStepsPayload | null;
    const degraded = isTriageDegraded(steps);
    const reasons: AttentionReason[] = ["awaiting_review"];
    if (degraded) reasons.push("degraded_triage");

    const ageMs = row.publishedAt ? Date.now() - row.publishedAt.getTime() : 0;
    const detail = degraded
      ? "AI processing was degraded — verify the brief before deciding."
      : `Published ${formatAge(ageMs)} ago · awaiting your decision.`;

    byId.set(row.id, {
      detail,
      href: `/review?focus=${row.id}`,
      reasons,
      requestId: row.id,
      sortKey: reasonPriority.awaiting_review,
      title: row.title,
    });
  }

  for (const row of pending) {
    const steps = row.triageSteps as TriageStepsPayload | null;
    const degraded = isTriageDegraded(steps);
    const dupCount = dupByRequest.get(row.id) ?? 0;
    const unresolvedDup = dupCount > 0 && row.intakeLinkedRequestId === null;

    if (!degraded && !unresolvedDup) continue;

    const reasons: AttentionReason[] = [];
    if (unresolvedDup) reasons.push("unresolved_duplicate");
    if (degraded) reasons.push("pending_confirm_degraded");

    const detail = unresolvedDup
      ? `${dupCount} possible duplicate candidate(s) — confirm or link before publishing.`
      : "AI intake needs manual review before you publish.";

    const existing = byId.get(row.id);
    if (existing) {
      for (const r of reasons)
        existing.reasons = mergeReason(existing.reasons, r);
      continue;
    }

    byId.set(row.id, {
      detail,
      href: `/feedback/new?resume=${row.id}`,
      reasons,
      requestId: row.id,
      sortKey: unresolvedDup
        ? reasonPriority.unresolved_duplicate
        : reasonPriority.pending_confirm_degraded,
      title: row.title,
    });
  }

  const all = [...byId.values()].toSorted((a, b) => {
    const pa = Math.min(...a.reasons.map((r) => reasonPriority[r]));
    const pb = Math.min(...b.reasons.map((r) => reasonPriority[r]));
    if (pa !== pb) return pa - pb;
    return a.title.localeCompare(b.title);
  });

  return {
    items: all.slice(0, cap),
    totalCount: all.length,
  };
};

const formatAge = (ms: number) => {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days >= 1) return `${days}d`;
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours >= 1) return `${hours}h`;
  const minutes = Math.floor(ms / (60 * 1000));
  return `${Math.max(1, minutes)}m`;
};
