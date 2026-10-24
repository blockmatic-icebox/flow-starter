export type DelegationPolicy = "solo" | "max-safe" | "adaptive";

export type ExecutionMode =
  | "solo"
  | "parallel-investigation"
  | "parallel-implementation"
  | "independent-verification";

export type WorkerRole = "coordinator" | "researcher" | "builder" | "verifier";

export type FlowStage =
  | "Explore"
  | "Specify"
  | "Plan"
  | "Build"
  | "Review"
  | "Ship";

export interface DelegationSignals {
  flowStage: FlowStage;
  buildAuthorized?: boolean;
  buildRequested?: boolean;
  adrConflict?: boolean;
  securitySensitive?: boolean;
  docsOnly?: boolean;
  smallWellUnderstood?: boolean;
  needsSpecification?: boolean;
  acceptedDecisionsPresent?: boolean;
  independentResearchCount?: number;
  parallelBuilderCount?: number;
  overlappingWrites?: boolean;
  subagentsAvailable?: boolean;
  overheadDominates?: boolean;
  conflictingResearch?: boolean;
  needsFunctionalReview?: boolean;
  needsUiReview?: boolean;
  waveGraph?: { taskCount: number; maxConcurrent: number };
}

export interface DelegationResult {
  executionMode: ExecutionMode;
  workerCount: number;
  roles: WorkerRole[];
  writable: boolean;
  skills: string[];
  humanGate: boolean;
  humanGateReason?: string;
  allowBuild: boolean;
  fallback?: string;
  maxConcurrent?: number;
}

const soloResult = ({
  signals,
  executionMode = "solo",
  skills,
  humanGate = false,
  humanGateReason,
  allowBuild = false,
  fallback,
}: {
  signals: DelegationSignals;
  executionMode?: ExecutionMode;
  skills: string[];
  humanGate?: boolean;
  humanGateReason?: string;
  allowBuild?: boolean;
  fallback?: string;
}): DelegationResult => ({
  executionMode,
  workerCount: 1,
  roles: ["coordinator"],
  writable: allowBuild && signals.flowStage === "Build",
  skills,
  humanGate,
  humanGateReason,
  allowBuild,
  fallback,
});

const researchSkills = (signals: DelegationSignals) => {
  if (signals.flowStage === "Explore") return ["idea-refine"];
  if (signals.needsSpecification)
    return ["prd-writing", "spec-driven-development"];
  if (signals.acceptedDecisionsPresent) return ["spec-driven-development"];
  return ["problem-validation"];
};

const parallelResearchers = ({
  signals,
  skills,
  count,
}: {
  signals: DelegationSignals;
  skills: string[];
  count?: number;
}): DelegationResult => ({
  executionMode: "parallel-investigation",
  workerCount: Math.max(2, count ?? signals.independentResearchCount ?? 2),
  roles: ["researcher", "researcher"],
  writable: false,
  skills,
  humanGate: false,
  allowBuild: false,
});

const matchBlocked = (
  signals: DelegationSignals
): DelegationResult | undefined => {
  if (signals.adrConflict)
    return soloResult({
      signals,
      skills: ["documentation-and-adrs"],
      humanGate: true,
      humanGateReason: "adr-conflict",
      allowBuild: false,
    });
  if (signals.buildRequested && !signals.buildAuthorized)
    return soloResult({
      signals,
      skills: [],
      humanGate: true,
      humanGateReason: "build-not-authorized",
      allowBuild: false,
    });
  if (signals.docsOnly)
    return soloResult({
      signals,
      skills: ["writing-for-agents"],
      allowBuild: false,
    });
  return undefined;
};

const matchSecurity = (
  signals: DelegationSignals
): DelegationResult | undefined => {
  if (!signals.securitySensitive) return undefined;
  const skills = [
    "better-auth-security-best-practices",
    "code-review-and-quality",
  ];
  if (signals.flowStage === "Review" || signals.needsFunctionalReview)
    return {
      executionMode: "independent-verification",
      workerCount: signals.needsUiReview ? 2 : 1,
      roles: signals.needsUiReview ? ["verifier", "verifier"] : ["verifier"],
      writable: false,
      skills: signals.needsUiReview ? [...skills, "agent-browser"] : skills,
      humanGate: true,
      humanGateReason: "security-sensitive",
      allowBuild: false,
    };
  return soloResult({
    signals,
    skills,
    humanGate: true,
    humanGateReason: "security-sensitive",
    allowBuild: false,
  });
};

const matchSpecifyExplore = (
  signals: DelegationSignals
): DelegationResult | undefined => {
  if (signals.smallWellUnderstood && signals.flowStage === "Build")
    return soloResult({
      signals,
      skills: ["test-driven-development"],
      allowBuild: signals.buildAuthorized === true,
    });
  if (signals.needsSpecification && signals.flowStage === "Specify")
    return soloResult({
      signals,
      skills: ["prd-writing", "spec-driven-development"],
      allowBuild: false,
    });
  if (signals.acceptedDecisionsPresent && signals.flowStage === "Specify")
    return parallelResearchers({
      signals,
      skills: ["spec-driven-development"],
    });
  if (signals.conflictingResearch)
    return parallelResearchers({
      signals,
      skills: researchSkills(signals),
      count: 2,
    });
  if (signals.flowStage === "Explore")
    return parallelResearchers({ signals, skills: ["idea-refine"] });
  return undefined;
};

const matchBuild = (
  signals: DelegationSignals
): DelegationResult | undefined => {
  if (
    signals.buildAuthorized &&
    signals.parallelBuilderCount &&
    signals.parallelBuilderCount > 0 &&
    !signals.overlappingWrites
  ) {
    const builders = signals.parallelBuilderCount;
    const total = signals.waveGraph?.taskCount ?? builders + 3;
    return {
      executionMode: "parallel-implementation",
      workerCount: total,
      roles: [
        "builder",
        ...Array.from({ length: builders }, () => "builder" as WorkerRole),
        "coordinator",
        "verifier",
      ],
      writable: true,
      skills: ["incremental-implementation", "test-driven-development"],
      humanGate: false,
      allowBuild: true,
      maxConcurrent: signals.waveGraph?.maxConcurrent ?? builders,
    };
  }
  if (signals.buildAuthorized && signals.flowStage === "Build")
    return soloResult({
      signals,
      skills: ["incremental-implementation", "test-driven-development"],
      allowBuild: true,
    });
  return undefined;
};

const matchReviewPlan = (
  signals: DelegationSignals
): DelegationResult | undefined => {
  if (
    signals.flowStage === "Review" &&
    (signals.needsFunctionalReview || signals.needsUiReview)
  )
    return {
      executionMode: "independent-verification",
      workerCount: signals.needsUiReview ? 2 : 1,
      roles: signals.needsUiReview ? ["verifier", "verifier"] : ["verifier"],
      writable: false,
      skills: signals.needsUiReview
        ? ["code-review-and-quality", "agent-browser"]
        : ["code-review-and-quality"],
      humanGate: false,
      allowBuild: false,
    };
  if (signals.flowStage === "Plan" && signals.waveGraph)
    return {
      executionMode: "parallel-implementation",
      workerCount: signals.waveGraph.taskCount,
      roles: ["coordinator"],
      writable: false,
      skills: ["planning-and-task-breakdown"],
      humanGate: false,
      allowBuild: false,
      maxConcurrent: signals.waveGraph.maxConcurrent,
    };
  return undefined;
};

const deriveCore = (signals: DelegationSignals): DelegationResult =>
  matchBlocked(signals) ??
  matchSecurity(signals) ??
  matchSpecifyExplore(signals) ??
  matchBuild(signals) ??
  matchReviewPlan(signals) ??
  soloResult({ signals, skills: [] });

const applyPolicy = ({
  policy,
  signals,
  core,
}: {
  policy: DelegationPolicy;
  signals: DelegationSignals;
  core: DelegationResult;
}): DelegationResult => {
  if (!signals.subagentsAvailable)
    return {
      ...soloResult({
        signals,
        skills: core.skills,
        allowBuild: core.allowBuild && signals.buildAuthorized === true,
        humanGate: core.humanGate,
        humanGateReason: core.humanGateReason,
      }),
      fallback: "subagents-unavailable",
    };

  if (policy === "solo")
    return soloResult({
      signals,
      skills: core.skills,
      humanGate: core.humanGate,
      humanGateReason: core.humanGateReason,
      allowBuild: core.allowBuild,
    });

  if (policy === "adaptive" && signals.overheadDominates) {
    const tinyParallel =
      (signals.independentResearchCount ?? 0) === 2 &&
      signals.flowStage === "Build" &&
      signals.smallWellUnderstood;
    if (tinyParallel)
      return soloResult({
        signals,
        skills: core.skills.length ? core.skills : ["test-driven-development"],
        allowBuild: signals.buildAuthorized === true,
      });
  }

  if (policy === "max-safe" && signals.overheadDominates) {
    const count = signals.independentResearchCount ?? 2;
    if (count > 1 && signals.flowStage === "Build")
      return {
        executionMode: "parallel-implementation",
        workerCount: count,
        roles: Array.from({ length: count }, () => "builder" as WorkerRole),
        writable: signals.buildAuthorized === true,
        skills: ["incremental-implementation"],
        humanGate: false,
        allowBuild: signals.buildAuthorized === true,
        maxConcurrent: count,
      };
  }

  return core;
};

export const classifyDelegation = ({
  policy,
  signals,
}: {
  policy: DelegationPolicy;
  signals: DelegationSignals;
}): DelegationResult => {
  const core = deriveCore(signals);
  return applyPolicy({ policy, signals, core });
};
