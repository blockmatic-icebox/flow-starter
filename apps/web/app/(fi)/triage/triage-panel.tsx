"use client";

import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { actionRecordPmReview, actionSetDisposition } from "../actions";

export const TriagePanel = ({
  requestId,
  brief,
  mergeTargets,
}: {
  requestId: string;
  brief: string | null;
  mergeTargets: { id: string; title: string }[];
}) => (
  <TriagePanelForm
    brief={brief}
    key={requestId}
    mergeTargets={mergeTargets}
    requestId={requestId}
  />
);

const TriagePanelForm = ({
  requestId,
  brief,
  mergeTargets,
}: {
  requestId: string;
  brief: string | null;
  mergeTargets: { id: string; title: string }[];
}) => {
  const router = useRouter();
  const reviewRecorded = useRef(false);
  const [rationale, setRationale] = useState(brief ?? "");
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [disposition, setDisposition] = useState<
    "merge" | "monitor" | "decline" | "needs_discussion"
  >("monitor");

  useEffect(() => {
    if (reviewRecorded.current) return;
    reviewRecorded.current = true;
    actionRecordPmReview({ requestId }).catch(console.error);
  }, [requestId]);

  const save = async () => {
    setError(null);
    if (!rationale.trim()) {
      setError("Add a disposition rationale before saving.");
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
      router.refresh();
    } catch (error_) {
      setError(
        error_ instanceof Error ? error_.message : "Could not save disposition"
      );
    }
  };

  return (
    <section aria-label="Record decision" className="space-y-2">
      <h3 className="text-sm font-semibold">Record decision</h3>
      <p className="text-muted-foreground text-xs">
        AI suggestions are not decisions until you save here.
      </p>
      <div className="space-y-3">
        <select
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          onChange={(e) => setDisposition(e.target.value as typeof disposition)}
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
            onChange={(e) => setMergeTargetId(e.target.value)}
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
          onChange={(e) => setRationale(e.target.value)}
          placeholder="Disposition rationale"
          rows={3}
          value={rationale}
        />
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <Button onClick={() => save().catch(console.error)} type="button">
          Record decision
        </Button>
      </div>
    </section>
  );
};
