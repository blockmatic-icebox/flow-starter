import { z } from "zod";

import {
  describeArchitecture,
  describeCapabilities,
  describeTechnologies,
  describeWorkflow,
} from "./facts";
import {
  listKnowledgeDocuments,
  readKnowledgeDocument,
  searchKnowledge,
} from "./knowledge";

export const flowAgentReadOnlyToolNames = [
  "describe_architecture",
  "describe_technologies",
  "describe_capabilities",
  "describe_workflow",
  "list_knowledge_documents",
  "read_knowledge_document",
  "search_knowledge",
] as const;

export type FlowAgentReadOnlyToolName =
  (typeof flowAgentReadOnlyToolNames)[number];

export const flowAgentToolDefinitions = {
  describe_architecture: {
    description:
      "How Flow Starter is structured, what is implemented versus planned, and how apps/web differs from apps/flow.",
    execute: () => ({ text: describeArchitecture() }),
    inputSchema: z.object({}),
  },
  describe_capabilities: {
    description:
      "What each application is for and how to explore GenUI, Flow Agent, and MCP.",
    execute: () => ({ text: describeCapabilities() }),
    inputSchema: z.object({}),
  },
  describe_technologies: {
    description: "List the main technologies and integrations in the starter.",
    execute: () => ({ text: describeTechnologies() }),
    inputSchema: z.object({}),
  },
  describe_workflow: {
    description:
      "Explain the Flow methodology stages Explore → Specify → Plan → Build → Review → Ship.",
    execute: () => ({ text: describeWorkflow() }),
    inputSchema: z.object({}),
  },
  list_knowledge_documents: {
    description:
      "List bundled repository documents Flow Agent may cite (read-only snapshot).",
    execute: () => ({
      text: JSON.stringify(listKnowledgeDocuments(), null, 2),
    }),
    inputSchema: z.object({}),
  },
  read_knowledge_document: {
    description:
      "Read one bundled document by exact path. Pass section for a single ## heading excerpt.",
    execute: ({
      path: documentPath,
      section,
    }: {
      path: string;
      section?: string;
    }) => {
      const result = readKnowledgeDocument({ path: documentPath, section });
      if (!result.ok) return { text: result.message };
      const title = result.section
        ? `# ${result.path} — ${result.section}`
        : `# ${result.path}`;
      return { text: `${title}\n\n${result.text}` };
    },
    inputSchema: z.object({
      path: z.string().min(1).max(200),
      section: z.string().min(1).max(200).optional(),
    }),
  },
  search_knowledge: {
    description:
      "Search bundled documentation for a topic; returns excerpts with source paths.",
    execute: ({ query }: { query: string }) => {
      const { hits } = searchKnowledge(query);
      if (hits.length === 0) {
        return {
          text: "No matching excerpts in the bundled knowledge snapshot.",
        };
      }
      return {
        text: hits.map((hit) => `## ${hit.path}\n${hit.excerpt}`).join("\n\n"),
      };
    },
    inputSchema: z.object({
      query: z.string().min(1).max(500),
    }),
  },
} as const;

export const runFlowAgentTool = (
  name: FlowAgentReadOnlyToolName,
  input: unknown = {}
) => {
  const definition = flowAgentToolDefinitions[name];
  const parsed = definition.inputSchema.safeParse(input);
  if (!parsed.success) return "Invalid tool input.";
  const execute = definition.execute as (value: unknown) => { text: string };
  return execute(parsed.data).text;
};

export const pickFlowAgentTool = (query: string): FlowAgentReadOnlyToolName => {
  const normalized = query.toLowerCase();
  if (
    /workflow|explore|specify|plan|build|review|ship|methodology|stage/u.test(
      normalized
    )
  ) {
    return "describe_workflow";
  }
  if (
    /tecnolog|technolog|stack|framework|drizzle|neon|turborepo|pnpm/u.test(
      normalized
    ) &&
    !/constru|built|architect|estructura|how is/u.test(normalized)
  ) {
    return "describe_technologies";
  }
  if (
    /qué puedo|what can i|capabilities|genui|mcp|difference|web app|product app/u.test(
      normalized
    )
  ) {
    return "describe_capabilities";
  }
  if (
    /document|docs\/|product\.md|design\.md|adr|pdr|readme/u.test(normalized)
  ) {
    return "search_knowledge";
  }
  return "describe_architecture";
};

export const wantsFocusGenui = (query: string) =>
  /\b(?:focus|scroll|show)\b.*\b(?:genui|generative|composition|visual)\b/iu.test(
    query
  );

export const wantsToggleTheme = (query: string) =>
  /\b(?:toggle|cambia|switch)\b.*\b(?:theme|tema|dark|light|oscuro|claro)\b/iu.test(
    query
  );
