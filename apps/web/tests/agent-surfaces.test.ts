import assert from "node:assert/strict";
import test from "node:test";

import { GET as getApiCatchAll } from "../app/api/[...path]/route";
import { GET as getChat } from "../app/api/chat/route";
import { GET as getOpenApi } from "../app/openapi.json/route";
import { buildOpenApiDocument } from "../lib/openapi/build-openapi-document";

test("openapi.json route returns OpenAPI 3.1 with MCP and tool paths", async () => {
  const response = getOpenApi(
    new Request("https://meta-cto-two.vercel.app/openapi.json")
  );
  assert.equal(response.status, 200);
  const doc = await response.json();
  assert.equal(doc.openapi, "3.1.0");
  assert.ok(doc.paths["/api/mcp"]?.post?.operationId === "mcpStreamableHttp");
  assert.ok(doc.paths["/api/chat"]?.post?.operationId === "fiAskOnlyChat");
  assert.ok(
    doc.paths["/api/genui/compose"]?.post?.operationId === "genuiCompose"
  );
  assert.ok(!doc.paths["/api/agents/tools/search_requests"]);
  const searchSchema = doc.components?.schemas?.McpTool_search_requests as {
    "x-mcp-tool"?: string;
    operationId?: string;
  };
  assert.equal(searchSchema?.["x-mcp-tool"], "search_requests");
});

test("buildOpenApiDocument catalogs search_requests with x-mcp-tool", () => {
  const doc = buildOpenApiDocument("https://example.com");
  const search = doc.components.schemas.McpTool_search_requests as {
    "x-mcp-tool"?: string;
    description?: string;
  };
  assert.equal(search["x-mcp-tool"], "search_requests");
  assert.match(search.description ?? "", /Search published/u);
});

test("GET /api/chat returns JSON error", async () => {
  const response = await getChat();
  assert.equal(response.status, 405);
  const body = await response.json();
  assert.equal(body.code, "method_not_allowed");
  assert.match(body.resolution, /POST/u);
});

test("unknown API path returns JSON 404", async () => {
  const response = getApiCatchAll();
  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.code, "api_route_not_found");
});
