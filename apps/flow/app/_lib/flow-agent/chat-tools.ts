import { asSchema, tool } from "ai";
import type { ToolSet } from "ai";
import { z } from "zod";

import { flowAgentReadOnlyToolNames, flowAgentToolDefinitions } from "./tools";

export const flowAgentChatToolNames = [
  ...flowAgentReadOnlyToolNames,
  "focus_genui",
  "toggle_theme",
] as const;

const buildFlowAgentChatTools = (): ToolSet => ({
  describe_architecture: tool({
    description: flowAgentToolDefinitions.describe_architecture.description,
    execute: flowAgentToolDefinitions.describe_architecture.execute,
    inputSchema: asSchema(
      flowAgentToolDefinitions.describe_architecture.inputSchema
    ),
  }),
  describe_capabilities: tool({
    description: flowAgentToolDefinitions.describe_capabilities.description,
    execute: flowAgentToolDefinitions.describe_capabilities.execute,
    inputSchema: asSchema(
      flowAgentToolDefinitions.describe_capabilities.inputSchema
    ),
  }),
  describe_technologies: tool({
    description: flowAgentToolDefinitions.describe_technologies.description,
    execute: flowAgentToolDefinitions.describe_technologies.execute,
    inputSchema: asSchema(
      flowAgentToolDefinitions.describe_technologies.inputSchema
    ),
  }),
  describe_workflow: tool({
    description: flowAgentToolDefinitions.describe_workflow.description,
    execute: flowAgentToolDefinitions.describe_workflow.execute,
    inputSchema: asSchema(
      flowAgentToolDefinitions.describe_workflow.inputSchema
    ),
  }),
  focus_genui: tool({
    description:
      "Focus the main Generative UI panel on the homepage. Use when the user asks to show or use the visual GenUI area.",
    inputSchema: asSchema(z.object({})),
  }),
  list_knowledge_documents: tool({
    description: flowAgentToolDefinitions.list_knowledge_documents.description,
    execute: flowAgentToolDefinitions.list_knowledge_documents.execute,
    inputSchema: asSchema(
      flowAgentToolDefinitions.list_knowledge_documents.inputSchema
    ),
  }),
  read_knowledge_document: tool({
    description: flowAgentToolDefinitions.read_knowledge_document.description,
    execute: flowAgentToolDefinitions.read_knowledge_document.execute,
    inputSchema: asSchema(
      flowAgentToolDefinitions.read_knowledge_document.inputSchema
    ),
  }),
  search_knowledge: tool({
    description: flowAgentToolDefinitions.search_knowledge.description,
    execute: flowAgentToolDefinitions.search_knowledge.execute,
    inputSchema: asSchema(
      flowAgentToolDefinitions.search_knowledge.inputSchema
    ),
  }),
  toggle_theme: tool({
    description:
      "Toggle light and dark theme for the site. Use when the user asks to change theme or dark mode.",
    inputSchema: asSchema(z.object({})),
  }),
});

let cachedFlowAgentChatTools: ToolSet | undefined;

export const getFlowAgentChatTools = (): ToolSet => {
  cachedFlowAgentChatTools ??= buildFlowAgentChatTools();
  return cachedFlowAgentChatTools;
};
