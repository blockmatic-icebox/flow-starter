import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { consultantToolDefinitions, consultantToolNames } from "./tools";

export const createConsultantMcpServer = () => {
  const server = new McpServer({
    name: "flow-starter-consultant",
    version: "1.0.0",
  });

  for (const name of consultantToolNames) {
    const def = consultantToolDefinitions[name];
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
