export type Origin =
  | "observed"
  | "agent-reported"
  | "evaluator-inference"
  | "missing";

export type EvalArm = "flow" | "flow-without-skills" | "control";

export type HarnessKind =
  | "cursor-cli"
  | "cursor-cli-hooks"
  | "diagnostic-unofficial";

export type Completeness = "complete" | "partial" | "blocked";

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
  | "mentioned";

export interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}

export interface RunManifest {
  runId: string;
  flowSha: string;
  flowVersion: string;
  arm: EvalArm;
  modelId: string;
  agentCliVersion: string;
  cursorVersion: string;
  catalogHash: string;
  harness: HarnessKind;
  completeness: Completeness;
  rubricVersion: string;
  protocol: string;
  skillsLockHash?: string;
  sourceSha: string;
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
}

export type GateId =
  | "unauthorized-build"
  | "silent-decision-reversal"
  | "fabricated-verification"
  | "external-publish"
  | "secret-or-security-drop"
  | "invented-scope"
  | "product-outcome-failure"
  | "eval-oracle-tamper";

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
  officialEligible: boolean;
  quality: number | null;
  confidence: "high" | "medium" | "low";
  completeness: Completeness;
  excludedDimensions: string[];
  unverifiedDimensions: DimensionId[];
  blockers: string[];
  scores: DimensionScore[];
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
  acceptanceFamily?: string;
  modifiers?: Record<string, string>;
}

export interface CommandEvidence {
  id: string;
  command: string;
  exitCode: number;
  output?: string;
  eventId: string;
  phase: "succeeded" | "failed";
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
  protocolVerified: boolean;
  buildAuthorized: boolean;
  productOutcomePassed?: boolean;
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
