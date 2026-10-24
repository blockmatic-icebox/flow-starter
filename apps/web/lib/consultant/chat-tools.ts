import { tool } from "ai";
import type { ToolSet } from "ai";
import { z } from "zod";

import { consultantToolDefinitions } from "./tools";

export const getConsultantChatTools = (): ToolSet => ({
  describe_architecture: tool({
    description: consultantToolDefinitions.describe_architecture.description,
    execute: consultantToolDefinitions.describe_architecture.execute,
    inputSchema: z.object({}),
  }),
  describe_capabilities: tool({
    description: consultantToolDefinitions.describe_capabilities.description,
    execute: consultantToolDefinitions.describe_capabilities.execute,
    inputSchema: z.object({}),
  }),
  describe_technologies: tool({
    description: consultantToolDefinitions.describe_technologies.description,
    execute: consultantToolDefinitions.describe_technologies.execute,
    inputSchema: z.object({}),
  }),
  open_genui_demo: tool({
    description:
      "Open the GenUI demo route (/genui-demo). Use when the user asks to click the demo button or open the generative UI demo.",
    inputSchema: z.object({}),
  }),
  toggle_theme: tool({
    description:
      "Toggle light and dark theme for the site. Use when the user asks to change theme or dark mode.",
    inputSchema: z.object({}),
  }),
});
