import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { flowAgentMcpToolNames } from "./mcp-tools";
import { flowAgentToolDefinitions } from "./tools";

export const createFlowAgentMcpServer = () => {
  const server = new McpServer({
    name: "flow-starter-flow-agent",
    version: "1.0.0",
  });

  for (const name of flowAgentMcpToolNames) {
    const def = flowAgentToolDefinitions[name];
    server.registerTool(
      name,
      {
        annotations: { openWorldHint: false, readOnlyHint: true },
        description: def.description,
        inputSchema: {},
      },
      () => {
        const result = def.execute();
        return { content: [{ text: result.text, type: "text" }] };
      }
    );
  }

  return server;
};

/** @deprecated use createFlowAgentMcpServer */
export const createConsultantMcpServer = createFlowAgentMcpServer;
