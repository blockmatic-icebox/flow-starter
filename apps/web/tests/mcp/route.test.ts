import assert from "node:assert/strict";
import test from "node:test";

import { POST as postApiMcp } from "../../app/api/mcp/route";
import { POST as postMcpAlias } from "../../app/mcp/route";
import { fiMcpToolCatalog } from "../../lib/mcp/tool-catalog";

const mcpHeaders = {
  Accept: "application/json, text/event-stream",
  "Content-Type": "application/json",
};

const mcpPost = (handler: typeof postApiMcp, body: unknown, accept?: string) =>
  handler(
    new Request("http://meta-cto.localhost/api/mcp", {
      body: JSON.stringify(body),
      headers: {
        ...mcpHeaders,
        ...(accept ? { Accept: accept } : {}),
      },
      method: "POST",
    })
  );

test("POST /api/mcp initialize returns 200", async () => {
  const response = await mcpPost(postApiMcp, {
    id: 1,
    jsonrpc: "2.0",
    method: "initialize",
    params: {
      capabilities: {},
      clientInfo: { name: "route-test", version: "1.0.0" },
      protocolVersion: "2025-03-26",
    },
  });
  assert.equal(response.status, 200);
  const json = (await response.json()) as {
    result?: { serverInfo?: { name?: string } };
  };
  assert.equal(json.result?.serverInfo?.name, "feature-intelligence");
});

test("POST /api/mcp tools/list returns all FI tools", async () => {
  const response = await mcpPost(postApiMcp, {
    id: 2,
    jsonrpc: "2.0",
    method: "tools/list",
    params: {},
  });
  assert.equal(response.status, 200);
  const json = (await response.json()) as {
    result?: { tools?: { name: string }[] };
  };
  const names = (json.result?.tools ?? []).map((t) => t.name).toSorted();
  const expected = fiMcpToolCatalog.map((t) => t.name).toSorted();
  assert.deepEqual(names, expected);
});

test("POST /api/mcp rejects Accept without text/event-stream", async () => {
  const response = await mcpPost(
    postApiMcp,
    {
      id: 1,
      jsonrpc: "2.0",
      method: "initialize",
      params: {
        capabilities: {},
        clientInfo: { name: "route-test", version: "1.0.0" },
        protocolVersion: "2025-03-26",
      },
    },
    "application/json"
  );
  assert.equal(response.status, 406);
});

test("POST /mcp alias matches /api/mcp initialize", async () => {
  const body = {
    id: 1,
    jsonrpc: "2.0",
    method: "initialize",
    params: {
      capabilities: {},
      clientInfo: { name: "alias-test", version: "1.0.0" },
      protocolVersion: "2025-03-26",
    },
  };
  const api = await mcpPost(postApiMcp, body);
  const alias = await mcpPost(postMcpAlias, body);
  assert.equal(api.status, 200);
  assert.equal(alias.status, 200);
  const apiJson = (await api.json()) as {
    result?: { serverInfo?: { name?: string } };
  };
  const aliasJson = (await alias.json()) as {
    result?: { serverInfo?: { name?: string } };
  };
  assert.equal(apiJson.result?.serverInfo?.name, "feature-intelligence");
  assert.equal(aliasJson.result?.serverInfo?.name, "feature-intelligence");
});

test("POST /api/mcp tools/call search_requests returns text content", async (t) => {
  if (!process.env.DATABASE_URL?.trim()) {
    t.skip("DATABASE_URL required for tools/call");
    return;
  }
  const response = await mcpPost(postApiMcp, {
    id: 3,
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      arguments: { limit: 2, query: "CSV" },
      name: "search_requests",
    },
  });
  assert.equal(response.status, 200);
  const json = (await response.json()) as {
    result?: { content?: { text?: string }[] };
  };
  const text = json.result?.content?.[0]?.text ?? "";
  assert.match(text, /requests/u);
});

const liveMcpHost = () =>
  (
    process.env.AGENTIC_CHECK_URL?.replace(/^https?:\/\//u, "") ??
    "meta-cto-two.vercel.app"
  ).replace(/\/$/u, "");

const liveMcpInitializeBody = {
  id: 1,
  jsonrpc: "2.0",
  method: "initialize",
  params: {
    capabilities: {},
    clientInfo: { name: "live-smoke", version: "1.0.0" },
    protocolVersion: "2025-03-26",
  },
};

test("live MCP smoke when AGENTIC_LIVE_MCP=1", async (t) => {
  if (process.env.AGENTIC_LIVE_MCP !== "1") {
    t.skip("Set AGENTIC_LIVE_MCP=1 to hit production");
    return;
  }
  const url = `https://${liveMcpHost()}/api/mcp`;
  const response = await fetch(url, {
    body: JSON.stringify(liveMcpInitializeBody),
    headers: mcpHeaders,
    method: "POST",
  });
  assert.equal(response.status, 200);
  const json = (await response.json()) as {
    result?: { serverInfo?: { name?: string } };
  };
  assert.equal(json.result?.serverInfo?.name, "feature-intelligence");
});

test("live POST /mcp alias when AGENTIC_LIVE_MCP=1", async (t) => {
  if (process.env.AGENTIC_LIVE_MCP !== "1") {
    t.skip("Set AGENTIC_LIVE_MCP=1 to hit production");
    return;
  }
  const url = `https://${liveMcpHost()}/mcp`;
  const response = await fetch(url, {
    body: JSON.stringify(liveMcpInitializeBody),
    headers: mcpHeaders,
    method: "POST",
  });
  assert.equal(response.status, 200);
  const json = (await response.json()) as {
    result?: { serverInfo?: { name?: string } };
  };
  assert.equal(json.result?.serverInfo?.name, "feature-intelligence");
});
