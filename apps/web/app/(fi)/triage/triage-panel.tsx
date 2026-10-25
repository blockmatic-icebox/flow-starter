"use client";

import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { actionRecordPmReview, actionSetDisposition } from "../actions";

export const TriagePanel = ({
  requestId,
  brief,
}: {
  requestId: string;
  brief: string | null;
}) => {
  const router = useRouter();
  const [rationale, setRationale] = useState(brief ?? "");
  const [disposition, setDisposition] = useState<
    "merge" | "monitor" | "decline" | "needs_discussion"
  >("monitor");

  const save = async () => {
    await actionRecordPmReview({ requestId });
    await actionSetDisposition({
      disposition,
      dispositionRationale: rationale,
      requestId,
    });
    router.refresh();
  };

  return (
    <div className="border-border space-y-3 border-t pt-4">
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
      <Textarea
        onChange={(e) => setRationale(e.target.value)}
        placeholder="Disposition rationale"
        rows={3}
        value={rationale}
      />
      <Button
        onClick={() => {
          save().catch(console.error);
        }}
        type="button"
      >
        Save disposition
      </Button>
    </div>
  );
};
