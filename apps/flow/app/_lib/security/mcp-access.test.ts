import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { handleMcpRequest } from "../../api/mcp/route";
import { mcpJsonRpcResult } from "../flow-agent/mcp-jsonrpc";
import { flowAgentMcpToolNames } from "../flow-agent/mcp-tools";
import { memoryCapStore } from "../genui/cap-store";

const appOrigin = "https://app.example";
const token = "test-token";

const productionBearer = {
  APP_ORIGIN: appOrigin,
  CONSULTANT_MCP_BEARER: token,
  NODE_ENV: "production",
  RATE_LIMIT_TRUSTED_IP_HEADER: "x-real-ip",
} satisfies NodeJS.ProcessEnv;

const memoryStore = () => ({
  mode: "memory" as const,
  ok: true as const,
  store: memoryCapStore(),
});

const initialize = {
  id: 1,
  jsonrpc: "2.0",
  method: "initialize",
  params: {
    capabilities: {},
    clientInfo: { name: "test", version: "1.0.0" },
    protocolVersion: "2025-03-26",
  },
};

const rpc = ({
  body,
  env,
  headers,
  method = "POST",
  url = `${appOrigin}/api/mcp`,
}: {
  body?: Record<string, unknown>;
  env: NodeJS.ProcessEnv;
  headers?: HeadersInit;
  method?: string;
  url?: string;
}) => {
  const trustedHeader = env.RATE_LIMIT_TRUSTED_IP_HEADER?.trim();
  const identityHeader =
    trustedHeader && !headers?.[trustedHeader as keyof HeadersInit]
      ? { [trustedHeader]: "203.0.113.10" }
      : {};
  return handleMcpRequest({
    createStore: memoryStore,
    env,
    request: new Request(url, {
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
        ...identityHeader,
        ...headers,
      },
      method,
    }),
  });
};

const callTool = async ({
  env,
  headers,
  name,
  url,
}: {
  env: NodeJS.ProcessEnv;
  headers?: HeadersInit;
  name: string;
  url?: string;
}) => {
  await rpc({ body: initialize, env, headers, url });
  const response = await rpc({
    body: {
      id: 2,
      jsonrpc: "2.0",
      method: "tools/call",
      params: { arguments: {}, name },
    },
    env,
    headers,
    url,
  });
  return mcpJsonRpcResult<{
    content?: { text: string }[];
    isError?: boolean;
  }>(response);
};

describe("MCP HTTP access", () => {
  it("is unavailable in production without a token or public opt-in", async () => {
    const response = await rpc({
      body: initialize,
      env: { APP_ORIGIN: appOrigin, NODE_ENV: "production" },
    });
    assert.equal(response.status, 503);
  });

  it("rejects an invalid bearer token", async () => {
    const response = await rpc({
      body: initialize,
      env: productionBearer,
      headers: { authorization: "Bearer wrong-token" },
    });
    assert.equal(response.status, 401);
  });

  it("accepts a valid bearer token", async () => {
    const response = await rpc({
      body: initialize,
      env: productionBearer,
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 200);
    const body = await mcpJsonRpcResult<{ serverInfo: { name: string } }>(
      response
    );
    assert.equal(body.result?.serverInfo.name, "flow-starter-flow-agent");
  });

  it("does not let a forged localhost hostname bypass production authentication", async () => {
    const response = await rpc({
      body: initialize,
      env: productionBearer,
      headers: {
        authorization: `Bearer ${token}`,
        host: "localhost",
      },
      url: "http://localhost/api/mcp",
    });
    assert.equal(response.status, 403);
  });

  it("rejects a cross-origin browser request", async () => {
    const response = await rpc({
      body: initialize,
      env: productionBearer,
      headers: {
        authorization: `Bearer ${token}`,
        origin: "https://evil.example",
      },
    });
    assert.equal(response.status, 403);
  });

  it("allows an authenticated native request without Origin", async () => {
    const response = await rpc({
      body: initialize,
      env: productionBearer,
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 200);
  });

  it("does not treat a matching Origin as authentication", async () => {
    const response = await rpc({
      body: initialize,
      env: productionBearer,
      headers: { origin: appOrigin },
    });
    assert.equal(response.status, 401);
  });

  it("exposes only the existing read-only tools in public mode", async () => {
    const env = {
      APP_ORIGIN: appOrigin,
      CONSULTANT_MCP_PUBLIC_READ_ONLY: "1",
      NODE_ENV: "production",
      RATE_LIMIT_TRUSTED_IP_HEADER: "x-real-ip",
    } as const satisfies NodeJS.ProcessEnv;
    await rpc({ body: initialize, env });
    const listed = await rpc({
      body: { id: 2, jsonrpc: "2.0", method: "tools/list", params: {} },
      env,
    });
    const body = await mcpJsonRpcResult<{ tools: { name: string }[] }>(listed);
    const names = body.result?.tools.map((tool) => tool.name) ?? [];
    assert.equal(names.length, flowAgentMcpToolNames.length);
    for (const name of flowAgentMcpToolNames) assert.ok(names.includes(name));
  });

  it("does not execute an unknown tool", async () => {
    const body = await callTool({
      env: productionBearer,
      headers: { authorization: `Bearer ${token}` },
      name: "not_a_tool",
    });
    const failed =
      Boolean(body.error) ||
      body.result?.isError === true ||
      /unknown|not found/iu.test(body.result?.content?.[0]?.text ?? "");
    assert.equal(failed, true);
  });

  it("does not execute a mutating tool name", async () => {
    const body = await callTool({
      env: {
        APP_ORIGIN: appOrigin,
        CONSULTANT_MCP_PUBLIC_READ_ONLY: "1",
        NODE_ENV: "production",
        RATE_LIMIT_TRUSTED_IP_HEADER: "x-real-ip",
      } as const satisfies NodeJS.ProcessEnv,
      name: "mutate_canvas",
    });
    const failed =
      Boolean(body.error) ||
      body.result?.isError === true ||
      /unknown|not found/iu.test(body.result?.content?.[0]?.text ?? "");
    assert.equal(failed, true);
  });

  it("applies the same access policy to GET, POST, and DELETE", async () => {
    const env = {
      APP_ORIGIN: appOrigin,
      NODE_ENV: "production",
    } as const satisfies NodeJS.ProcessEnv;
    const statuses = await Promise.all(
      ["GET", "POST", "DELETE"].map(async (method) => {
        const response = await rpc({ env, method });
        return response.status;
      })
    );
    assert.deepEqual(statuses, [503, 503, 503]);
  });

  it("still initializes and lists tools for an allowed client", async () => {
    const env = {
      NODE_ENV: "development",
    } as const satisfies NodeJS.ProcessEnv;
    const url = "http://127.0.0.1/api/mcp";
    const started = await rpc({ body: initialize, env, url });
    assert.equal(started.status, 200);
    const listed = await rpc({
      body: { id: 2, jsonrpc: "2.0", method: "tools/list", params: {} },
      env,
      url,
    });
    const body = await mcpJsonRpcResult<{ tools: { name: string }[] }>(listed);
    assert.equal(body.result?.tools.length, flowAgentMcpToolNames.length);
  });

  it("rejects wildcard origin configuration", async () => {
    const response = await rpc({
      body: initialize,
      env: {
        ...productionBearer,
        CONSULTANT_MCP_ALLOWED_ORIGINS: "*",
      },
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 503);
  });
});
