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
  authenticationSensitive?: boolean;
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

const securityReviewSkills = (signals: DelegationSignals) => {
  const base = ["code-review-and-quality"];
  if (signals.authenticationSensitive)
    return ["better-auth-security-best-practices", ...base];
  return base;
};

const parallelResearchers = ({
  signals,
  skills,
  count,
}: {
  signals: DelegationSignals;
  skills: string[];
  count?: number;
}): DelegationResult => {
  const workerCount = Math.max(
    2,
    count ?? signals.independentResearchCount ?? 2
  );
  return {
    executionMode: "parallel-investigation",
    workerCount,
    roles: Array.from(
      { length: workerCount },
      () => "researcher" as WorkerRole
    ),
    writable: false,
    skills,
    humanGate: false,
    allowBuild: false,
  };
};

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
  const skills = securityReviewSkills(signals);
  if (signals.flowStage === "Review" || signals.needsFunctionalReview)
    return {
      executionMode: "independent-verification",
      workerCount: signals.needsUiReview ? 2 : 1,
      roles: signals.needsUiReview
        ? (["verifier", "verifier"] as WorkerRole[])
        : ["verifier"],
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
    return soloResult({
      signals,
      skills: researchSkills(signals),
      humanGate: true,
      humanGateReason: "conflicting-research",
      allowBuild: false,
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
    return {
      executionMode: "parallel-implementation",
      workerCount: builders,
      roles: Array.from({ length: builders }, () => "builder" as WorkerRole),
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
      roles: signals.needsUiReview
        ? (["verifier", "verifier"] as WorkerRole[])
        : ["verifier"],
      writable: false,
      skills: signals.needsUiReview
        ? ["code-review-and-quality", "agent-browser"]
        : ["code-review-and-quality"],
      humanGate: false,
      allowBuild: false,
    };
  if (signals.flowStage === "Plan" && signals.waveGraph) {
    const researchCount = signals.independentResearchCount ?? 0;
    if (researchCount > 1)
      return parallelResearchers({
        signals,
        skills: ["planning-and-task-breakdown"],
        count: researchCount,
      });
    return soloResult({
      signals,
      skills: ["planning-and-task-breakdown"],
      allowBuild: false,
    });
  }
  return undefined;
};

const deriveCore = (signals: DelegationSignals): DelegationResult =>
  matchBlocked(signals) ??
  matchSecurity(signals) ??
  matchSpecifyExplore(signals) ??
  matchBuild(signals) ??
  matchReviewPlan(signals) ??
  soloResult({ signals, skills: [] });

const soloFromCore = ({
  signals,
  core,
  fallback,
}: {
  signals: DelegationSignals;
  core: DelegationResult;
  fallback?: string;
}) =>
  soloResult({
    signals,
    skills: core.skills,
    humanGate: core.humanGate,
    humanGateReason: core.humanGateReason,
    allowBuild: core.allowBuild,
    fallback,
  });

const applyPolicy = ({
  policy,
  signals,
  core,
}: {
  policy: DelegationPolicy;
  signals: DelegationSignals;
  core: DelegationResult;
}): DelegationResult => {
  if (!signals.subagentsAvailable) {
    if (policy === "solo") return soloFromCore({ signals, core });
    return {
      ...soloFromCore({ signals, core, fallback: "subagents-unavailable" }),
      fallback: "subagents-unavailable",
    };
  }

  if (policy === "solo") return soloFromCore({ signals, core });

  if (core.humanGate) return core;

  if (policy === "adaptive" && signals.overheadDominates)
    return soloFromCore({ signals, core });

  if (policy === "max-safe" && signals.overheadDominates) {
    const count = signals.independentResearchCount ?? 2;
    if (
      count > 1 &&
      signals.flowStage === "Build" &&
      core.allowBuild &&
      !core.humanGate
    )
      return {
        executionMode: "parallel-implementation",
        workerCount: count,
        roles: Array.from({ length: count }, () => "builder" as WorkerRole),
        writable: true,
        skills: ["incremental-implementation"],
        humanGate: false,
        allowBuild: true,
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
