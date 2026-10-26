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
  assert.ok(doc.paths["/api/agents/tools/search_requests"]);
});

test("buildOpenApiDocument documents search_requests with operationId", () => {
  const doc = buildOpenApiDocument("https://example.com");
  const search = doc.paths["/api/agents/tools/search_requests"] as {
    post?: { operationId?: string };
  };
  assert.equal(search.post?.operationId, "searchRequests");
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
