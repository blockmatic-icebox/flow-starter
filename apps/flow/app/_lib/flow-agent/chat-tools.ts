import { tool } from "ai";
import type { ToolSet } from "ai";
import { z } from "zod";

import { flowAgentReadOnlyToolNames, flowAgentToolDefinitions } from "./tools";

export const flowAgentChatToolNames = [
  ...flowAgentReadOnlyToolNames,
  "focus_genui",
  "toggle_theme",
] as const;

const flowAgentToolFromDefinition = (
  name: keyof typeof flowAgentToolDefinitions
) =>
  tool({
    description: flowAgentToolDefinitions[name].description,
    execute: flowAgentToolDefinitions[name].execute,
    inputSchema: flowAgentToolDefinitions[name].inputSchema,
  });

const buildFlowAgentChatTools = (): ToolSet => ({
  describe_architecture: flowAgentToolFromDefinition("describe_architecture"),
  describe_capabilities: flowAgentToolFromDefinition("describe_capabilities"),
  describe_technologies: flowAgentToolFromDefinition("describe_technologies"),
  describe_workflow: flowAgentToolFromDefinition("describe_workflow"),
  focus_genui: tool({
    description:
      "Focus the main Generative UI panel on the homepage. Use when the user asks to show or use the visual GenUI area.",
    inputSchema: z.object({}),
  }),
  list_knowledge_documents: flowAgentToolFromDefinition(
    "list_knowledge_documents"
  ),
  read_knowledge_document: flowAgentToolFromDefinition(
    "read_knowledge_document"
  ),
  search_knowledge: flowAgentToolFromDefinition("search_knowledge"),
  toggle_theme: tool({
    description:
      "Toggle light and dark theme for the site. Use when the user asks to change theme or dark mode.",
    inputSchema: z.object({}),
  }),
});

let cachedFlowAgentChatTools: ToolSet | undefined;

export const getFlowAgentChatTools = (): ToolSet => {
  cachedFlowAgentChatTools ??= buildFlowAgentChatTools();
  return cachedFlowAgentChatTools;
};

/** @deprecated use getFlowAgentChatTools */
export const getConsultantChatTools = getFlowAgentChatTools;
