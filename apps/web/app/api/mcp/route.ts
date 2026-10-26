import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/server";

import { jsonError, withExtraHeaders } from "@/lib/api/json-error";
import { mergeResponseHeaders } from "@/lib/api/rate-limit-headers";
import { createStarterMcpServer } from "@/lib/mcp/create-mcp-server";
import { consumeMcpRateLimit } from "@/lib/mcp/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const handleMcp = async (request: Request) => {
  const { headers: rateHeaders, limited } = consumeMcpRateLimit(request);
  if (limited) return mergeResponseHeaders(limited, rateHeaders);

  const server = createStarterMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);
  try {
    const response = await transport.handleRequest(request);
    return mergeResponseHeaders(response, rateHeaders);
  } catch (error) {
    return withExtraHeaders(
      jsonError({
        code: "mcp_handler_error",
        message: error instanceof Error ? error.message : "MCP request failed",
        resolution:
          "Verify JSON-RPC body and Accept headers for Streamable HTTP.",
        status: 500,
      }),
      rateHeaders
    );
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
