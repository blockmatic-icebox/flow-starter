import { tool } from "ai";
import type { ToolSet } from "ai";
import { z } from "zod";

import { flowAgentToolDefinitions } from "./tools";

export const getFlowAgentChatTools = (): ToolSet => ({
  describe_architecture: tool({
    description: flowAgentToolDefinitions.describe_architecture.description,
    execute: flowAgentToolDefinitions.describe_architecture.execute,
    inputSchema: z.object({}),
  }),
  describe_capabilities: tool({
    description: flowAgentToolDefinitions.describe_capabilities.description,
    execute: flowAgentToolDefinitions.describe_capabilities.execute,
    inputSchema: z.object({}),
  }),
  describe_technologies: tool({
    description: flowAgentToolDefinitions.describe_technologies.description,
    execute: flowAgentToolDefinitions.describe_technologies.execute,
    inputSchema: z.object({}),
  }),
  describe_workflow: tool({
    description: flowAgentToolDefinitions.describe_workflow.description,
    execute: flowAgentToolDefinitions.describe_workflow.execute,
    inputSchema: z.object({}),
  }),
  focus_genui: tool({
    description:
      "Focus the main Generative UI panel on the homepage. Use when the user asks to show or use the visual GenUI area.",
    inputSchema: z.object({}),
  }),
  list_knowledge_documents: tool({
    description: flowAgentToolDefinitions.list_knowledge_documents.description,
    execute: flowAgentToolDefinitions.list_knowledge_documents.execute,
    inputSchema: z.object({}),
  }),
  read_knowledge_document: tool({
    description: flowAgentToolDefinitions.read_knowledge_document.description,
    execute: flowAgentToolDefinitions.read_knowledge_document.execute,
    inputSchema: flowAgentToolDefinitions.read_knowledge_document.inputSchema,
  }),
  search_knowledge: tool({
    description: flowAgentToolDefinitions.search_knowledge.description,
    execute: flowAgentToolDefinitions.search_knowledge.execute,
    inputSchema: flowAgentToolDefinitions.search_knowledge.inputSchema,
  }),
  toggle_theme: tool({
    description:
      "Toggle light and dark theme for the site. Use when the user asks to change theme or dark mode.",
    inputSchema: z.object({}),
  }),
});

/** @deprecated use getFlowAgentChatTools */
export const getConsultantChatTools = getFlowAgentChatTools;
