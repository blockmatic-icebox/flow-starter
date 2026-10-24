import { tool } from "ai";
import type { ToolSet } from "ai";
import { z } from "zod";

import { flowAgentReadOnlyToolNames, flowAgentToolDefinitions } from "./tools";

export const flowAgentChatToolNames = [
  ...flowAgentReadOnlyToolNames,
  "focus_genui",
  "toggle_theme",
] as const;

const buildFlowAgentChatTools = (): ToolSet => {
  const tools: ToolSet = {
    focus_genui: tool({
      description:
        "Focus the main Generative UI panel on the homepage. Use when the user asks to show or use the visual GenUI area.",
      inputSchema: z.object({}),
    }),
    toggle_theme: tool({
      description:
        "Toggle light and dark theme for the site. Use when the user asks to change theme or dark mode.",
      inputSchema: z.object({}),
    }),
  };

  for (const name of flowAgentReadOnlyToolNames) {
    const def = flowAgentToolDefinitions[name];
    tools[name] = tool({
      description: def.description,
      execute: def.execute,
      inputSchema: def.inputSchema,
    });
  }

  return tools;
};

let cachedFlowAgentChatTools: ToolSet | undefined;

export const getFlowAgentChatTools = (): ToolSet => {
  cachedFlowAgentChatTools ??= buildFlowAgentChatTools();
  return cachedFlowAgentChatTools;
};
