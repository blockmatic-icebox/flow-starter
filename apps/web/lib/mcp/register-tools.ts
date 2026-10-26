import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/server";
import {
  componentNames,
  composeQuery,
  compositionGuidance,
  MAX_QUERY_CODE_POINTS,
} from "@repo/genui";
import { z } from "zod";

import { GENUI_PREVIEW_RESOURCE_URI } from "./genui-preview-resource";
import { asToolResult } from "./tool-result";

const previewToolMeta = {
  _meta: { ui: { resourceUri: GENUI_PREVIEW_RESOURCE_URI } },
};

const plainToolMeta = { _meta: {} };

export const registerStarterMcpTools = (server: McpServer) => {
  registerAppTool(
    server,
    "health",
    {
      ...plainToolMeta,
      description: "Liveness check for the MCP server.",
      inputSchema: { ping: z.boolean().optional() },
    },
    () => asToolResult({ ok: true, service: "flow-starter-mcp" })
  );

  registerAppTool(
    server,
    "list_component_catalog",
    {
      ...plainToolMeta,
      description:
        "List registered GenUI root components and composition guidance.",
      inputSchema: { detail: z.boolean().optional() },
    },
    () =>
      asToolResult({
        components: componentNames,
        guidance: compositionGuidance,
      })
  );

  registerAppTool(
    server,
    "compose_ui",
    {
      description:
        "Generate a validated OpenUI composition from a natural-language UI request using synthetic data.",
      inputSchema: {
        query: z.string().min(1).max(MAX_QUERY_CODE_POINTS),
      },
      ...previewToolMeta,
    },
    async ({ query }) => {
      const clientRequestId = `mcp-${Date.now()}`;
      const result = await composeQuery({
        input: { clientRequestId, query, version: 1 },
      });
      const complete = result.events.find((e) => e.type === "complete");
      if (!complete || complete.type !== "complete")
        return asToolResult({
          error: "composition_failed",
          validationOk: result.metadata.validationOk,
        });
      return asToolResult({
        envelope: complete.envelope,
        metadata: result.metadata,
      });
    }
  );
};
