import { z } from "zod";

import {
  describeArchitecture,
  describeCapabilities,
  describeTechnologies,
} from "./facts";

export const consultantToolNames = [
  "describe_architecture",
  "describe_technologies",
  "describe_capabilities",
] as const;

export type ConsultantToolName = (typeof consultantToolNames)[number];

export const consultantToolDefinitions = {
  describe_architecture: {
    description:
      "How Flow Starter is structured, what is implemented versus planned. Use when asked how the app or repo is built.",
    execute: () => ({ text: describeArchitecture() }),
    inputSchema: z.object({}),
  },
  describe_capabilities: {
    description:
      "What adopters can do with the baseline and how to explore GenUI and MCP. Use for what can I do questions.",
    execute: () => ({ text: describeCapabilities() }),
    inputSchema: z.object({}),
  },
  describe_technologies: {
    description:
      "List the main technologies and integrations in the starter. Use for stack or framework questions.",
    execute: () => ({ text: describeTechnologies() }),
    inputSchema: z.object({}),
  },
} as const;

export const runConsultantTool = (name: ConsultantToolName) => {
  const tool = consultantToolDefinitions[name];
  const result = tool.execute();
  return result.text;
};

export const pickConsultantTool = (
  query: string
): ConsultantToolName | null => {
  const normalized = query.toLowerCase();
  if (
    /tecnolog|technolog|stack|framework|next\.?js|react|openui|mcp/u.test(
      normalized
    ) &&
    !/constru|built|architect|estructura|how is/u.test(normalized)
  ) {
    return "describe_technologies";
  }
  if (
    /qué puedo|what can i|capabilities|adopt|fork|genui|demo|mcp/u.test(
      normalized
    )
  ) {
    return "describe_capabilities";
  }
  if (
    /constru|built|architect|estructura|how is|cómo está|repo|monorepo/u.test(
      normalized
    )
  ) {
    return "describe_architecture";
  }
  return "describe_architecture";
};

export const wantsOpenGenuiDemo = (query: string) =>
  /\b(?:click|pulsa|open|abre)\b.*\b(?:genui|demo|botón|button)\b/iu.test(
    query
  ) || /\b(?:genui|demo)\b.*\b(?:click|abre|open)\b/iu.test(query);

export const wantsToggleTheme = (query: string) =>
  /\b(?:toggle|cambia|switch)\b.*\b(?:theme|tema|dark|light|oscuro|claro)\b/iu.test(
    query
  );
