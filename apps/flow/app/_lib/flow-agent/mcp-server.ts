import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { flowAgentMcpToolNames } from "./mcp-tools";
import type { FlowAgentReadOnlyToolName } from "./tools";
import { flowAgentToolDefinitions, runFlowAgentTool } from "./tools";

export const registerFlowAgentToolsOnMcpServer = ({
  server,
  toolNames,
}: {
  server: McpServer;
  toolNames: readonly FlowAgentReadOnlyToolName[];
}) => {
  for (const name of toolNames) {
    const def = flowAgentToolDefinitions[name];
    server.registerTool(
      name,
      {
        annotations: { openWorldHint: false, readOnlyHint: true },
        description: def.description,
        inputSchema: def.inputSchema,
      },
      (input: Record<string, unknown>) => {
        try {
          const text = runFlowAgentTool(
            name,
            (input ?? {}) as Record<string, unknown>
          );
          return { content: [{ text, type: "text" as const }] };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Tool execution failed.";
          return {
            content: [{ text: message, type: "text" as const }],
            isError: true,
          };
        }
      }
    );
  }
};

export const createFlowAgentMcpServer = () => {
  const server = new McpServer({
    name: "flow-starter-flow-agent",
    version: "1.0.0",
  });

  registerFlowAgentToolsOnMcpServer({
    server,
    toolNames: flowAgentMcpToolNames,
  });

  return server;
};
