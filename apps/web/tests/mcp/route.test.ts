import assert from "node:assert/strict";
import test from "node:test";

import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";

import { POST as postApiMcp } from "../../app/api/mcp/route";
import { POST as postMcpAlias } from "../../app/mcp/route";
import { HUNCH_EXPLORER_RESOURCE_URI } from "../../lib/mcp/hunch-explorer-resource";
import { fiMcpToolCatalog } from "../../lib/mcp/tool-catalog";

const explorerLinkedTools = [
  "search_requests",
  "get_request",
  "list_triage_queue",
  "get_insights",
  "submit_request",
] as const;

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
  assert.ok(response.headers.get("RateLimit-Limit"));
  assert.ok(response.headers.get("RateLimit-Remaining"));
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
    result?: {
      tools?: {
        _meta?: { ui?: { resourceUri?: string } };
        name: string;
      }[];
    };
  };
  const tools = json.result?.tools ?? [];
  const names = tools.map((t) => t.name).toSorted();
  const expected = fiMcpToolCatalog.map((t) => t.name).toSorted();
  assert.deepEqual(names, expected);

  for (const name of explorerLinkedTools) {
    const tool = tools.find((t) => t.name === name);
    assert.equal(
      tool?._meta?.ui?.resourceUri,
      HUNCH_EXPLORER_RESOURCE_URI,
      `${name} should link Hunch Explorer`
    );
  }
});

test("POST /api/mcp resources/list includes Hunch Explorer", async () => {
  const response = await mcpPost(postApiMcp, {
    id: 10,
    jsonrpc: "2.0",
    method: "resources/list",
    params: {},
  });
  assert.equal(response.status, 200);
  const json = (await response.json()) as {
    result?: { resources?: { name?: string; uri?: string }[] };
  };
  const uris = (json.result?.resources ?? []).map((r) => r.uri);
  assert.ok(uris.includes(HUNCH_EXPLORER_RESOURCE_URI));
});

test("POST /api/mcp resources/read returns MCP App HTML", async () => {
  const response = await mcpPost(postApiMcp, {
    id: 11,
    jsonrpc: "2.0",
    method: "resources/read",
    params: { uri: HUNCH_EXPLORER_RESOURCE_URI },
  });
  assert.equal(response.status, 200);
  const json = (await response.json()) as {
    result?: {
      contents?: { mimeType?: string; text?: string; uri?: string }[];
    };
  };
  const content = json.result?.contents?.[0];
  assert.equal(content?.uri, HUNCH_EXPLORER_RESOURCE_URI);
  assert.equal(content?.mimeType, RESOURCE_MIME_TYPE);
  assert.match(content?.text ?? "", /<html/iu);
  assert.match(content?.text ?? "", /Hunch Explorer/iu);
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
      arguments: { limit: 2, query: "shift swap" },
      name: "search_requests",
    },
  });
  assert.equal(response.status, 200);
  const json = (await response.json()) as {
    result?: { content?: { text?: string }[] };
  };
  const text = json.result?.content?.[0]?.text ?? "";
  assert.match(text, /requests/u);
  assert.match(text, /swap|shift/iu);
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

test("POST /api/mcp returns Retry-After when rate limited", async () => {
  const body = {
    id: 1,
    jsonrpc: "2.0",
    method: "initialize",
    params: {
      capabilities: {},
      clientInfo: { name: "rate-limit-test", version: "1.0.0" },
      protocolVersion: "2025-03-26",
    },
  };
  let limited: Response | null = null;
  for (let i = 0; i < 125; i += 1) {
    // oxlint-disable-next-line eslint/no-await-in-loop -- rate limit must be exercised sequentially
    const response = await mcpPost(postApiMcp, body);
    if (response.status === 429) {
      limited = response;
      break;
    }
  }
  assert.ok(limited, "expected HTTP 429 after exceeding MCP rate limit");
  assert.ok(limited.headers.get("Retry-After"));
  assert.ok(limited.headers.get("RateLimit-Limit"));
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
