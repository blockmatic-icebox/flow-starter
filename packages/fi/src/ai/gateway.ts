import { createGateway } from "@ai-sdk/gateway";
import type { LanguageModel } from "ai";

const defaultDecisionModel = "typesafe-ai/jev";
const defaultSynthesisModel = "anthropic/claude-sonnet-4.6";

export const getAiGateway = () => {
  const apiKey = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!apiKey) return null;
  return createGateway({ apiKey });
};

export const getFiDecisionModel = (): LanguageModel | null => {
  const gateway = getAiGateway();
  if (!gateway) return null;
  const modelId = process.env.FI_DECISION_MODEL?.trim() || defaultDecisionModel;
  return gateway(modelId);
};

export const getFiSynthesisModel = (): LanguageModel | null => {
  const gateway = getAiGateway();
  if (!gateway) return null;
  const modelId =
    process.env.FI_SYNTHESIS_MODEL?.trim() || defaultSynthesisModel;
  return gateway(modelId);
};
