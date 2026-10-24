import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { handleConsultantMcpRequest } from "./mcp-handler";
import { mcpJsonRpcRequest, mcpJsonRpcResult } from "./mcp-jsonrpc";
import { flowAgentMcpToolNames } from "./mcp-tools";

const post = (body: Record<string, unknown>) =>
  mcpJsonRpcRequest({ body, handler: handleConsultantMcpRequest });

describe("consultant MCP protocol", () => {
  it("initialize returns server info", async () => {
    const response = await post({
      id: 1,
      jsonrpc: "2.0",
      method: "initialize",
      params: {
        capabilities: {},
        clientInfo: { name: "test", version: "1.0.0" },
        protocolVersion: "2025-03-26",
      },
    });
    assert.equal(response.status, 200);
    const body = await mcpJsonRpcResult<{
      protocolVersion: string;
      serverInfo: { name: string };
    }>(response);
    assert.equal(body.error, undefined);
    assert.equal(body.result?.serverInfo.name, "flow-starter-flow-agent");
  });

  it("tools/list exposes read-only consultant tools", async () => {
    await post({
      id: 1,
      jsonrpc: "2.0",
      method: "initialize",
      params: {
        capabilities: {},
        clientInfo: { name: "test", version: "1.0.0" },
        protocolVersion: "2025-03-26",
      },
    });
    const response = await post({
      id: 2,
      jsonrpc: "2.0",
      method: "tools/list",
      params: {},
    });
    const body = await mcpJsonRpcResult<{
      tools: { name: string }[];
    }>(response);
    const names = body.result?.tools?.map((tool) => tool.name) ?? [];
    assert.equal(names.length, flowAgentMcpToolNames.length);
    for (const name of flowAgentMcpToolNames) {
      assert.ok(names.includes(name));
    }
  });

  it("tools/call describe_architecture returns text", async () => {
    await post({
      id: 1,
      jsonrpc: "2.0",
      method: "initialize",
      params: {
        capabilities: {},
        clientInfo: { name: "test", version: "1.0.0" },
        protocolVersion: "2025-03-26",
      },
    });
    const response = await post({
      id: 2,
      jsonrpc: "2.0",
      method: "tools/call",
      params: { arguments: {}, name: "describe_architecture" },
    });
    const body = await mcpJsonRpcResult<{
      content: { text: string; type: string }[];
    }>(response);
    assert.equal(body.error, undefined);
    assert.equal(body.result?.content[0]?.type, "text");
    assert.match(body.result?.content[0]?.text ?? "", /Flow Starter/u);
  });

  it("tools/call rejects unknown tools", async () => {
    await post({
      id: 1,
      jsonrpc: "2.0",
      method: "initialize",
      params: {
        capabilities: {},
        clientInfo: { name: "test", version: "1.0.0" },
        protocolVersion: "2025-03-26",
      },
    });
    const response = await post({
      id: 2,
      jsonrpc: "2.0",
      method: "tools/call",
      params: { arguments: {}, name: "mutate_canvas" },
    });
    const body = await mcpJsonRpcResult<{
      content?: { text: string }[];
      isError?: boolean;
    }>(response);
    const failed =
      Boolean(body.error) ||
      body.result?.isError === true ||
      /unknown|not found/iu.test(body.result?.content?.[0]?.text ?? "");
    assert.equal(failed, true);
  });
});
