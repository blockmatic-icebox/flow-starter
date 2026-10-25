export type EvidenceStatus =
  | "passed"
  | "failed"
  | "blocked"
  | "unverified"
  | "not-applicable";

export type VerificationKind = "unit" | "integration" | "browser" | "security";

export type RequirementRecord = {
  requirementId: string;
  title: string;
  releaseBlocking: boolean;
  source: string;
  verification: { caseId: string; kind: VerificationKind }[];
  nonGoal?: boolean;
};

export type CaseEvidence = {
  requirementId: string;
  caseId: string;
  evaluatedSha: string;
  environment: string;
  executionMethod: string;
  expected: string;
  actual: string;
  exitCode: number | null;
  evidenceRef: string;
  origin: "fixture" | "live" | "mocked";
  status: EvidenceStatus;
};

export type ReadinessDimension = "engineering" | "features" | "usability";

export type DimensionVerdict = "PASS" | "FAIL" | "INCONCLUSIVE";

export type ReadinessReport = {
  engineering: DimensionVerdict;
  features: DimensionVerdict;
  usability: DimensionVerdict;
  requiredCriteria: number;
  passed: number;
  failed: number;
  unverified: number;
  blocked: number;
  releaseVerdict: "READY" | "NOT_READY" | "INCONCLUSIVE";
  evaluatedRevision: string;
  evidence: CaseEvidence[];
};

export type StressFinding = {
  findingId: string;
  severity: "P0" | "P1" | "P2" | "P3";
  requirementId?: string;
  expected: string;
  observed: string;
  reproduction: string[];
  evidence: string[];
  confidence: "high" | "medium" | "low";
  recommendedFix?: string;
};
