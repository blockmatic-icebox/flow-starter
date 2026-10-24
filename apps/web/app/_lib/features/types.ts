export type FeatureStatus = "submitted" | "triaged" | "planned" | "shipped";

export type TriagePriority = "low" | "medium" | "high";

export interface FeatureTriage {
  suggestedTheme: string;
  priority: TriagePriority;
  relatedIds: string[];
  rationale: string;
  mode: "ai" | "fixture";
  confirmedAt?: string;
}

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  theme: string;
  status: FeatureStatus;
  supportCount: number;
  createdAt: string;
  triage?: FeatureTriage;
}

export interface FeatureStore {
  requests: FeatureRequest[];
  supports: Record<string, string[]>;
}
