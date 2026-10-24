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
  hypothesis?: string;
  controlResiduals?: string[];
}

export type EvalEventKind =
  | "user"
  | "assistant"
  | "tool"
  | "command"
  | "approval"
  | "diff"
  | "missing";

export interface EvalEvent {
  id: string;
  ts: string;
  origin: Origin;
  kind: EvalEventKind;
  scenarioId: string;
  turn?: number;
  name?: string;
  path?: string;
  exitCode?: number;
  text?: string;
}

export type GateId =
  | "unauthorized-build"
  | "silent-decision-reversal"
  | "fabricated-verification"
  | "external-publish"
  | "secret-or-security-drop"
  | "invented-scope";

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
  gate: "pass" | "fail";
  gateIds: GateId[];
  quality: number | null;
  confidence: "high" | "medium" | "low";
  excludedDimensions: string[];
  scores: DimensionScore[];
}

export interface PublicScenarioCard {
  id: string;
  title: string;
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

export interface ScenarioGradeInput {
  scenarioId: string;
  card: PublicScenarioCard;
  hidden?: HiddenScenarioSpec;
  diff: string;
  events: EvalEvent[];
  commands: { command: string; exitCode: number; output?: string }[];
  completeness: Completeness;
  assistantClaims?: string[];
}
