import assert from "node:assert/strict";
import test from "node:test";

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { GET as getMcpDiscovery } from "../../app/.well-known/mcp/route";
import { GET as getMcpServerCard } from "../../app/.well-known/mcp/server-card.json/route";
import { createFiMcpServer } from "../../lib/mcp/create-mcp-server";
import { fiMcpToolCatalog } from "../../lib/mcp/tool-catalog";

const mcpPost = async (body: unknown, sessionId?: string) => {
  const server = createFiMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  const headers: Record<string, string> = {
    Accept: "application/json, text/event-stream",
    "Content-Type": "application/json",
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  const response = await transport.handleRequest(
    new Request("http://localhost/api/mcp", {
      body: JSON.stringify(body),
      headers,
      method: "POST",
    })
  );
  await transport.close();
  await server.close();
  return response;
};

test("GET /.well-known/mcp returns discovery index", async () => {
  const response = getMcpDiscovery(
    new Request("http://meta-cto.localhost/.well-known/mcp")
  );
  assert.equal(response.status, 200);
  const json = (await response.json()) as {
    serverCard?: string;
    serverCards?: string[];
  };
  assert.match(
    json.serverCard ?? "",
    /\/\.well-known\/mcp\/server-card\.json$/u
  );
  assert.deepEqual(json.serverCards, [json.serverCard]);
});

test("GET /.well-known/mcp/server-card.json matches live transport", async () => {
  const response = getMcpServerCard(
    new Request("http://meta-cto.localhost/.well-known/mcp/server-card.json")
  );
  assert.equal(response.status, 200);
  const json = (await response.json()) as {
    transport?: { endpoint?: string; type?: string };
  };
  assert.equal(json.transport?.type, "streamable-http");
  assert.equal(json.transport?.endpoint, "http://meta-cto.localhost/api/mcp");
});

test("MCP initialize and tools/list exposes all FI tools", async () => {
  const init = await mcpPost({
    id: 1,
    jsonrpc: "2.0",
    method: "initialize",
    params: {
      capabilities: {},
      clientInfo: { name: "smoke", version: "1.0.0" },
      protocolVersion: "2025-03-26",
    },
  });
  assert.equal(init.status, 200);
  const initJson = (await init.json()) as {
    result?: { protocolVersion?: string };
  };
  assert.ok(initJson.result?.protocolVersion);

  const list = await mcpPost({
    id: 2,
    jsonrpc: "2.0",
    method: "tools/list",
    params: {},
  });
  assert.equal(list.status, 200);
  const listJson = (await list.json()) as {
    result?: { tools?: { name: string }[] };
  };
  const names = (listJson.result?.tools ?? []).map((t) => t.name).toSorted();
  const expected = fiMcpToolCatalog.map((t) => t.name).toSorted();
  assert.deepEqual(names, expected);
});
