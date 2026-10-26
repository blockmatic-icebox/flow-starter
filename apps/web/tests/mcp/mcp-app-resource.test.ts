import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/server";

import { createFiMcpServer } from "../../lib/mcp/create-mcp-server";
import {
  HUNCH_EXPLORER_RESOURCE_URI,
  hunchExplorerHtmlPath,
  readHunchExplorerHtml,
} from "../../lib/mcp/hunch-explorer-resource";

const mcpPost = async (body: unknown) => {
  const server = createFiMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  const response = await transport.handleRequest(
    new Request("http://localhost/api/mcp", {
      body: JSON.stringify(body),
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
      },
      method: "POST",
    })
  );
  await transport.close();
  await server.close();
  return response;
};

test("hunch explorer bundle exists on disk after build:mcp-app", async () => {
  await access(hunchExplorerHtmlPath());
});

test("readHunchExplorerHtml returns single-file MCP App HTML", async () => {
  const html = await readHunchExplorerHtml();
  assert.match(html, /<!doctype html>/iu);
  assert.match(html, /Hunch Explorer/iu);
  assert.match(html, /<html/iu);
  assert.ok(html.length > 1000, "expected bundled single-file HTML");
});

test("MCP resources/list registers Hunch Explorer app resource", async () => {
  const response = await mcpPost({
    id: 1,
    jsonrpc: "2.0",
    method: "resources/list",
    params: {},
  });
  assert.equal(response.status, 200);
  const json = (await response.json()) as {
    result?: {
      resources?: { mimeType?: string; name?: string; uri?: string }[];
    };
  };
  const resources = json.result?.resources ?? [];
  const explorer = resources.find((r) => r.uri === HUNCH_EXPLORER_RESOURCE_URI);
  assert.ok(explorer, "Hunch Explorer resource missing from resources/list");
  assert.equal(explorer.name, "Hunch Explorer");
  assert.equal(explorer.mimeType, RESOURCE_MIME_TYPE);
});

test("MCP resources/read returns HTML with mcp-app MIME type", async () => {
  const response = await mcpPost({
    id: 2,
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
  assert.match(content?.text ?? "", /Hunch Explorer/iu);
});

test("MCP resources/read rejects unknown URI", async () => {
  const response = await mcpPost({
    id: 3,
    jsonrpc: "2.0",
    method: "resources/read",
    params: { uri: "ui://hunch/missing" },
  });
  const json = (await response.json()) as {
    error?: { code?: number; message?: string };
    result?: unknown;
  };
  assert.ok(json.error, "expected JSON-RPC error for unknown resource");
  assert.equal(json.result, undefined);
});
