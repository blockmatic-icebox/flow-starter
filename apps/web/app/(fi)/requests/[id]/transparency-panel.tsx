"use client";

import type { TriageStepsPayload } from "@repo/fi";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/components/collapsible";

export const TransparencyPanel = ({
  triageSteps,
}: {
  triageSteps: TriageStepsPayload | null;
}) => {
  if (!triageSteps?.steps?.length) return null;

  return (
    <Collapsible className="rounded-lg border">
      <CollapsibleTrigger className="hover:bg-muted flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-sm font-medium">
        How this was evaluated
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 px-4 pb-4 text-sm">
        <p className="text-muted-foreground">
          Completed in {Math.round(triageSteps.duration_ms / 1000)}s
          {triageSteps.degraded ? " (degraded path)" : ""}
        </p>
        <ol className="list-decimal space-y-1 pl-4">
          {triageSteps.steps.map((step) => (
            <li key={step.name}>
              <span className="font-medium">{step.name}</span>
              {step.detail ? ` — ${step.detail}` : null}
            </li>
          ))}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
};
