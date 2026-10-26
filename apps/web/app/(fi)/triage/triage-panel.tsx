"use client";

import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { actionRecordPmReview, actionSetDisposition } from "../actions";

export const TriagePanel = ({
  requestId,
  brief,
  mergeTargets,
  queueIds,
  sort,
}: {
  requestId: string;
  brief: string | null;
  mergeTargets: { id: string; title: string }[];
  queueIds: string[];
  sort: string;
}) => (
  <TriagePanelForm
    brief={brief}
    key={requestId}
    mergeTargets={mergeTargets}
    queueIds={queueIds}
    requestId={requestId}
    sort={sort}
  />
);

const TriagePanelForm = ({
  requestId,
  brief,
  mergeTargets,
  queueIds,
  sort,
}: {
  requestId: string;
  brief: string | null;
  mergeTargets: { id: string; title: string }[];
  queueIds: string[];
  sort: string;
}) => {
  const router = useRouter();
  const reviewRecorded = useRef(false);
  const [rationale, setRationale] = useState(brief ?? "");
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [disposition, setDisposition] = useState<
    "merge" | "monitor" | "decline" | "needs_discussion"
  >("monitor");

  useEffect(() => {
    if (reviewRecorded.current) return;
    reviewRecorded.current = true;
    actionRecordPmReview({ requestId }).catch(console.error);
  }, [requestId]);

  const nextFocus = () => {
    const idx = queueIds.indexOf(requestId);
    const next =
      idx !== -1 && idx < queueIds.length - 1
        ? queueIds[idx + 1]
        : queueIds.find((id) => id !== requestId);
    const sp = new URLSearchParams();
    if (sort !== "support") sp.set("sort", sort);
    if (next && next !== requestId) sp.set("focus", next);
    const qs = sp.toString();
    router.push(qs ? `/review?${qs}` : "/review");
    router.refresh();
  };

  const save = async () => {
    setError(null);
    if (!rationale.trim()) {
      setError("Add a rationale before recording your decision.");
      return;
    }
    if (disposition === "merge" && !mergeTargetId) {
      setError("Choose a merge target.");
      return;
    }
    try {
      await actionSetDisposition({
        disposition,
        dispositionRationale: rationale,
        mergeTargetId: disposition === "merge" ? mergeTargetId : null,
        requestId,
      });
      setDirty(false);
      nextFocus();
    } catch (error_) {
      setError(
        error_ instanceof Error ? error_.message : "Could not save decision"
      );
    }
  };

  const nextInQueue = queueIds.find((id) => id !== requestId);
  const sortQuery = sort === "support" ? "" : `&sort=${sort}`;

  return (
    <section aria-label="Record decision" className="space-y-2">
      <h3 className="text-sm font-semibold">Record decision</h3>
      <p className="text-muted-foreground text-xs">
        AI suggestions are not decisions until you save. Unsaved edits stay in
        this form if save fails.
      </p>
      {dirty ? (
        <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
          Unsaved changes
        </p>
      ) : null}
      <div className="space-y-3">
        <select
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          onChange={(e) => {
            setDisposition(e.target.value as typeof disposition);
            setDirty(true);
          }}
          value={disposition}
        >
          <option value="monitor">Monitor</option>
          <option value="merge">Merge</option>
          <option value="decline">Decline</option>
          <option value="needs_discussion">Needs discussion</option>
        </select>
        {disposition === "merge" ? (
          <select
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            onChange={(e) => {
              setMergeTargetId(e.target.value);
              setDirty(true);
            }}
            value={mergeTargetId}
          >
            <option value="">Select merge target…</option>
            {mergeTargets
              .filter((t) => t.id !== requestId)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
          </select>
        ) : null}
        <Textarea
          onChange={(e) => {
            setRationale(e.target.value);
            setDirty(true);
          }}
          placeholder="Decision rationale"
          rows={3}
          value={rationale}
        />
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <Button onClick={() => save().catch(console.error)} type="button">
          Record decision
        </Button>
        {nextInQueue ? (
          <Link
            className="text-primary block text-xs hover:underline"
            href={`/review?focus=${nextInQueue}${sortQuery}`}
          >
            Review next item
          </Link>
        ) : null}
      </div>
    </section>
  );
};
