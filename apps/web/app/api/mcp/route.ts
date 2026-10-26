import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/server";

import { jsonError } from "@/lib/api/json-error";
import { createFiMcpServer } from "@/lib/mcp/create-mcp-server";
import { checkMcpRateLimit } from "@/lib/mcp/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const handleMcp = async (request: Request) => {
  const limited = checkMcpRateLimit(request);
  if (limited) return limited;

  const server = createFiMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);
  try {
    return await transport.handleRequest(request);
  } catch (error) {
    return jsonError({
      code: "mcp_handler_error",
      message: error instanceof Error ? error.message : "MCP request failed",
      resolution:
        "Verify JSON-RPC body and Accept headers for Streamable HTTP.",
      status: 500,
    });
  } finally {
    await transport.close();
    await server.close();
  }
};

export const POST = handleMcp;
export const GET = handleMcp;
export const DELETE = handleMcp;
export const OPTIONS = () =>
  new Response(null, {
    headers: {
      Allow: "GET, POST, DELETE, OPTIONS",
    },
    status: 204,
  });
