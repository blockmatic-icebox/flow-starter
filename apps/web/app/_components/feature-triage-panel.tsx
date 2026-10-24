"use client";

import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Spinner } from "@repo/ui/components/spinner";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { saveTriageSuggestion } from "@/app/_lib/features/actions";
import type { FeatureTriage } from "@/app/_lib/features/types";

export const FeatureTriagePanel = ({
  initialTriage,
  requestId,
}: {
  initialTriage?: FeatureTriage;
  requestId: string;
}) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [triage, setTriage] = useState<FeatureTriage | undefined>(
    initialTriage
  );

  const runTriage = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/features/triage", {
        body: JSON.stringify({ id: requestId }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as {
        message?: string;
        triage?: FeatureTriage;
      };
      if (!response.ok) {
        setError(payload.message ?? "Triage failed.");
        setLoading(false);
        return;
      }
      if (!payload.triage) {
        setError("No triage payload returned.");
        setLoading(false);
        return;
      }
      setTriage(payload.triage);
      await saveTriageSuggestion({ id: requestId, triage: payload.triage });
      router.refresh();
      setLoading(false);
    } catch {
      setError("Network error while running triage.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium">AI-assisted triage</h2>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Suggests theme, priority, and related requests. A human confirms
          before the item is prioritized.
        </p>
      </div>
      <Button disabled={loading} onClick={runTriage} type="button">
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Spinner className="size-4" />
            Running triage…
          </span>
        ) : (
          "Run triage"
        )}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Triage error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {triage && (
        <p className="text-muted-foreground text-xs">
          Mode: {triage.mode}. Review the suggestion card below and confirm when
          ready.
        </p>
      )}
    </div>
  );
};
