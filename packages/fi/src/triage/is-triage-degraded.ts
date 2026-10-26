import type { TriageStepsPayload } from "./types";

export const isTriageDegraded = (
  triageSteps: TriageStepsPayload | null | undefined
) => {
  if (!triageSteps) return false;
  if (triageSteps.degraded === true) return true;
  if (triageSteps.needs_ai_review === true) return true;
  return false;
};
