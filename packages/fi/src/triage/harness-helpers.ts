import type { DuplicateCandidate } from "./types";

const decisionModelId = () =>
  process.env.FI_DECISION_MODEL?.trim() || "typesafe-ai/jev";
const synthesisModelId = () =>
  process.env.FI_SYNTHESIS_MODEL?.trim() || "anthropic/claude-sonnet-4.6";

export const hasGatewayKey = () =>
  Boolean(process.env.AI_GATEWAY_API_KEY?.trim());

export const triageModelLabel = (degraded: boolean) =>
  degraded ? "degraded" : `${decisionModelId()}+${synthesisModelId()}`;

export const mergeDuplicateExplanations = (
  candidates: DuplicateCandidate[],
  explanations: { explanation: string; requestId: string }[]
): DuplicateCandidate[] => {
  const explanationById = new Map(
    explanations.map((e) => [e.requestId, e.explanation])
  );
  return candidates.map((c) => ({
    ...c,
    explanation: explanationById.get(c.id) ?? c.explanation,
  }));
};

export const resolveDegraded = ({
  gatewayMissing,
  classificationDegraded,
}: {
  gatewayMissing: boolean;
  classificationDegraded: boolean;
}) => gatewayMissing || classificationDegraded;
