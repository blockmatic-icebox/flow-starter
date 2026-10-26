import type { ThemeKey } from "../theme/registry";

export interface TriageStepRecord {
  detail: string;
  name: string;
  method?: string;
}

export interface TriageStepsPayload {
  degraded?: boolean;
  duration_ms: number;
  model: string;
  needs_ai_review?: boolean;
  steps: TriageStepRecord[];
  version: number;
}

export interface DuplicateCandidate {
  explanation: string;
  id: string;
  score: number;
  title: string;
}

export interface TriageHarnessResult {
  decisionBrief: string;
  degraded: boolean;
  dispositionSuggestion: string | null;
  duplicateCandidates: DuplicateCandidate[];
  problemStatement: string;
  recommendedIntakeLinkId: string | null;
  themeKey: ThemeKey;
  themeLabel: string;
  themeRationale: string;
  triageConfidence: number;
  triageSteps: TriageStepsPayload;
}

export interface ClassificationResult {
  degraded: boolean;
  isSolutionShaped: boolean;
  linkDuplicateId: string | null;
  themeKey: ThemeKey;
  themeSkippedJev: boolean;
}
