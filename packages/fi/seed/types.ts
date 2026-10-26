type Disposition = "decline" | "merge" | "monitor" | "needs_discussion";
type Source = "customer" | "prospect" | "support" | "internal";
type Status =
  | "archived"
  | "draft"
  | "pending_confirm"
  | "published"
  | "triaging";

export interface SeedDuplicateCandidate {
  candidateRequestId: string;
  explanation: string;
  score: number;
}

export interface CrewdayDemoContext {
  accountLabel: string;
  organizationKey: string;
  personaKey: string;
  submitterRole: string;
}

export interface SeedRequestRow {
  canonicalRequestId?: string | null;
  decisionBrief?: string | null;
  demoContext?: CrewdayDemoContext;
  description: string;
  disposition?: Disposition | null;
  dispositionAt?: Date | null;
  dispositionRationale?: string | null;
  duplicateCandidates?: SeedDuplicateCandidate[];
  id: string;
  intakeLinkedRequestId?: string | null;
  mergeTargetId?: string | null;
  pmReviewStartedAt?: Date | null;
  problemStatement: string;
  publishedAt?: Date | null;
  scenarioTag?: string;
  source: Source;
  status: Status;
  submittedAt: Date;
  supportCount: number;
  supporterKeys?: string[];
  themeKey: string;
  themeRationale?: string;
  title: string;
  triageCompletedAt?: Date | null;
}

export type SeedDuplicateRow = SeedDuplicateCandidate & {
  requestId: string;
};

export interface GeneratedSeed {
  duplicateCandidates: SeedDuplicateRow[];
  requests: SeedRequestRow[];
}
