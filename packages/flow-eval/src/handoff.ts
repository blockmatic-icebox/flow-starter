import type { PublicScenarioCard } from "./types.ts";

export type HandoffVariant = "C1" | "C2" | "C3";

export const handoffAgentBPrompt = ({
  variant,
}: {
  variant: HandoffVariant;
}) => {
  if (variant === "C1")
    return "Continue the approved PennyPilot slice. Do not rediscover the problem from scratch.";
  if (variant === "C2")
    return "Continue implementation from the last Build slice. Run verification on what exists before adding scope.";
  return "The stakeholder changed cancellation policy. Continue from repository documents only; do not assume the old brief still applies.";
};

export const handoffMetrics = ({
  agentBQuestions,
  contradictions,
  docsRead,
}: {
  agentBQuestions: number;
  contradictions: number;
  docsRead: string[];
}) => ({
  contradictionsIntroduced: contradictions,
  irrelevantDocsOpened: docsRead.filter(
    (p) => !/initiatives|PRODUCT|flow\.md/u.test(p)
  ),
  relevantDocsOpened: docsRead.filter((p) =>
    /initiatives|PRODUCT|flow\.md/u.test(p)
  ),
  repeatedQuestions: agentBQuestions,
});

export const continuityScenarioId = "S07";

export const continuityCard = (): PublicScenarioCard => ({
  allowProductCode: false,
  allowStandalonePlan: false,
  browserVerification: false,
  codeExecution: false,
  id: "S07",
  openingPrompt:
    "I want to build PennyPilot — help me explore the product idea with realistic scope.",
  relevantStages: ["Explore", "Specify", "Plan"],
  requiresBuildAuth: true,
  title: "Mid-project handoff",
  turnCap: 8,
});
