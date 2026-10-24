import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { createFlowAgentMcpServer } from "./mcp-server";

export const handleFlowAgentMcpRequest = async (request: Request) => {
  const server = createFlowAgentMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  return transport.handleRequest(request);
};
