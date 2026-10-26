import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerFiMcpTools } from "./register-tools";

export const createFiMcpServer = () => {
  const server = new McpServer({
    name: "feature-intelligence",
    version: "1.0.0",
  });
  registerFiMcpTools(server);
  return server;
};
