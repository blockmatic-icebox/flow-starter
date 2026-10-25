export type Origin =
  | "observed"
  | "agent-reported"
  | "evaluator-inference"
  | "missing";

export type EvalArm = "flow" | "flow-without-skills" | "control";

export type HarnessKind =
  | "cursor-cli"
  | "cursor-cli-hooks"
  | "host-session"
  | "diagnostic-unofficial";

export type EvalHost = "cursor" | "claude" | "other";

export type Completeness = "complete" | "partial" | "blocked";

export type HostJobStatus =
  | "pending"
  | "running"
  | "awaiting-host"
  | "awaiting-record"
  | "complete"
  | "failed"
  | "blocked"
  | "timed-out"
  | "cancelled";

export type TurnTermination =
  | "completed"
  | "timeout"
  | "truncated"
  | "exited"
  | "malformed";

export type EventPhase =
  | "started"
  | "completed"
  | "attempted"
  | "succeeded"
  | "failed"
  | "unknown"
  | "mentioned";

export type EvidenceValidity = "valid" | "limited" | "invalid";

export interface CommonSourceIdentity {
  commitSha: string;
  fingerprint: string;
  recordedAt: string;
}

export interface TrustedEvaluatorRevision {
  commitSha: string;
  recordedAt: string;
}

export interface EvaluatedProductSnapshot {
  treeSha: string;
  fingerprint: string;
  recordedAt: string;
}

export interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}

export interface PreparedSourceIdentity {
  commitSha: string;
  fingerprint: string;
  recordedAt: string;
  treeSha?: string;
}

export type OutcomeVerdict = "pass" | "fail" | "unverified" | "missing" | "na";

export interface ScenarioOutcomes {
  taskOutcome: OutcomeVerdict;
  verificationClaim: OutcomeVerdict;
  conflictHandling?: OutcomeVerdict;
  evidenceCompleteness: Completeness;
}

export interface RunManifest {
  runId: string;
  flowSha: string;
  flowVersion: string;
  arm: EvalArm;
  modelId?: string;
  host?: EvalHost;
  agentCliVersion: string;
  cursorVersion: string;
  catalogHash: string;
  harness: HarnessKind;
  completeness: Completeness;
  rubricVersion: string;
  protocol: string;
  skillsLockHash?: string;
  sourceSha: string;
  /** @deprecated use commonSource for v2 compatibility checks */
  preparedSource?: PreparedSourceIdentity;
  commonSource?: CommonSourceIdentity;
  trustedEvaluatorRevision?: TrustedEvaluatorRevision;
  frozenCatalogHash?: string;
  frozenScenarioOracleHash?: string;
  frozenSkillsLockHash?: string;
  scenarioOracleHash?: string;
  isolationBlockers?: string[];
  isolationCapabilities?: Record<string, string>;
  officialComparisonAllowed?: boolean;
  runnerCaptureComplete?: boolean;
  sandboxEnabled: boolean;
  trustEnabled: boolean;
  scenarioIds: string[];
  repetition?: number;
  usage?: TokenUsage;
  hypothesis?: string;
  controlResiduals?: string[];
  acceptedControlResiduals?: string[];
}

export type EvalEventKind =
  | "user"
  | "assistant"
  | "tool"
  | "command"
  | "approval"
  | "diff"
  | "system"
  | "result"
  | "missing";

export interface EvalEvent {
  id: string;
  seq: number;
  ts: string;
  origin: Origin;
  kind: EvalEventKind;
  scenarioId: string;
  turn?: number;
  name?: string;
  path?: string;
  exitCode?: number;
  text?: string;
  callId?: string;
  command?: string;
  phase?: EventPhase;
  args?: Record<string, unknown>;
  result?: Record<string, unknown>;
  rawType?: string;
  rawSubtype?: string;
  /** Present when origin is observed from trusted runner subprocess capture */
  captureMethod?: "runner-subprocess";
  invocationId?: string;
}

export type GateId =
  | "unauthorized-build"
  | "silent-decision-reversal"
  | "fabricated-verification"
  | "external-publish"
  | "secret-or-security-drop"
  | "invented-scope"
  | "product-outcome-failure"
  | "eval-oracle-tamper"
  | "conflict-handling-failure"
  | "verification-claim-failure";

export type DimensionId =
  | "intent-fidelity"
  | "workflow-judgment"
  | "context-management"
  | "skill-execution"
  | "artifact-quality"
  | "human-authorization"
  | "verification";

export type DimensionScoreValue = 0 | 1 | 2 | 3 | 4 | "na" | "unverified";

export interface DimensionScore {
  id: DimensionId;
  score: DimensionScoreValue;
  evidenceIds: string[];
  origin: Origin;
}

export interface GradeResult {
  scenarioId: string;
  repetition?: number;
  productOutcomePassed?: boolean;
  gate: "pass" | "fail";
  gateIds: GateId[];
  evidenceValidity?: EvidenceValidity;
  evidenceLimitations?: string[];
  officialEligible: boolean;
  /** @deprecated v2 reports use outcomes; always null for subject-evaluator-v2 */
  quality: number | null;
  confidence: "high" | "medium" | "low";
  completeness: Completeness;
  excludedDimensions: string[];
  unverifiedDimensions: DimensionId[];
  blockers: string[];
  scores: DimensionScore[];
  outcomes?: ScenarioOutcomes;
}

export interface PublicScenarioCard {
  id: string;
  title: string;
  heldOut?: boolean;
  historicalId?: string;
  openingPrompt: string;
  turnCap: number;
  requiresBuildAuth: boolean;
  allowProductCode: boolean;
  allowStandalonePlan: boolean;
  relevantStages: string[];
  codeExecution: boolean;
  browserVerification: boolean;
  hiddenSha256?: string;
  /** When set, runner provisions an isolated Neon Local database for this scenario. */
  persistence?: "required";
}

export interface HiddenScenarioSpec {
  id: string;
  persona: string;
  privateFacts: string[];
  alreadyKnown: string[];
  approvalLines: { turn: number; message: string; authorizesBuild?: boolean }[];
  nonGoals: string[];
  stopCondition: string;
  injections?: { id: string; afterTurn: number; userMessage: string }[];
}

export interface ScenarioOracle {
  scenarioId: string;
  expectsTools?: boolean;
  expectsCommands?: boolean;
  requiredDiffPatterns?: string[];
  forbiddenDiffPatterns?: string[];
  requiredPaths?: string[];
  decisionForbiddenPatterns?: string[];
  nonGoalPatterns?: string[];
  requiresPassingTestCommand?: boolean;
  allowsProductCode?: boolean;
  productOutcomeCheck?: "listings-sort-asc";
  conflictHandlingCheck?: boolean;
  acceptanceFamily?: string;
  modifiers?: Record<string, string>;
}

export interface CommandEvidence {
  id: string;
  command: string;
  exitCode?: number;
  output?: string;
  eventId: string;
  phase: "succeeded" | "failed" | "unknown";
  cwd?: string;
  snapshotId?: string;
  seq?: number;
}

export interface ScenarioGradeInput {
  scenarioId: string;
  card: PublicScenarioCard;
  hidden?: HiddenScenarioSpec;
  oracle?: ScenarioOracle;
  diff: string;
  events: EvalEvent[];
  commands: CommandEvidence[];
  completeness: Completeness;
  assistantClaims?: string[];
  harness: HarnessKind;
  protocol?: string;
  protocolVerified: boolean;
  isolationBlockers?: string[];
  buildAuthorized: boolean;
  productOutcomePassed?: boolean;
  runId?: string;
  conflictHandlingReview?: "pass" | "fail";
  evaluatedSnapshot?: EvaluatedProductSnapshot;
  worktreePath?: string;
}

export interface AgentTurnResult {
  exitCode: number;
  termination: TurnTermination;
  sessionId?: string;
  toolCount: number;
  completeness: Completeness;
  events: EvalEvent[];
  protocolVerified: boolean;
  usage?: TokenUsage;
}

export interface PrepBaselineMeta {
  commitSha: string;
  treeSha: string;
  fingerprint: string;
  recordedAt: string;
}

export interface AgentDiffCapture {
  patch: string;
  statusPorcelain: string;
  commitsAfterBaseline: string;
}
