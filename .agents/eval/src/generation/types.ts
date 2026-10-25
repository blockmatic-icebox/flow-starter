import type {
  HiddenScenarioSpec,
  PublicScenarioCard,
  ScenarioOracle,
} from "../types.ts";

export const GENERATOR_VERSION = "1";

export type AcceptanceFamily =
  | "support-tickets"
  | "shift-scheduler"
  | "inventory-ledger"
  | "help-board"
  | "work-orders"
  | "library-holds";

export type WorkCategory =
  | "new-product"
  | "extension"
  | "defect-repair"
  | "ai-first-workflow"
  | "data-workflow"
  | "ux-improvement"
  | "security"
  | "integration"
  | "architecture-constraint"
  | "regression-recovery"
  | "ambiguous-requirements"
  | "performance-reliability";

export type ExperimentProfile =
  | "full-product"
  | "mixed"
  | "technical-ai-assessment";

export type ScenarioTemplate = {
  templateId: string;
  category: WorkCategory;
  domain: string;
  complexity: 1 | 2 | 3;
  technicalSurface: string;
  flowStageStress: string;
  failureClass: string;
  titleBase: string;
  productContext: string;
  personaVariants: string[];
  problemStem: string;
  outcomes: string[];
  constraints: string[];
  acceptanceCriteria: string[];
  nonGoals: string[];
  fixturePreconditions: string[];
  failureModes: string[];
  turnCap: number;
  requiresBuildAuth: boolean;
  codeExecution: boolean;
  browserVerification: boolean;
  relevantStages: string[];
  acceptanceFamily?: AcceptanceFamily;
};

export type GeneratedScenario = {
  id: string;
  templateId: string;
  category: WorkCategory;
  domain: string;
  complexity: number;
  modifiers: Record<string, string>;
  publicBrief: string;
  publicCard: PublicScenarioCard;
  hidden: HiddenScenarioSpec;
  oracle: ScenarioOracle & {
    acceptanceChecks: string[];
    holdoutNotes: string[];
  };
};

export type ExperimentManifest = {
  strategy: "randomized" | "frozen-replay" | "methodology-stratified";
  seed: string;
  generatorVersion: string;
  catalogHash: string;
  scenarioIds: string[];
  scenarioHashes: string[];
  sourceSha: string;
  model: string;
  evaluationArm: string;
  profile: ExperimentProfile;
  createdAt: string;
  experimentId: string;
};
