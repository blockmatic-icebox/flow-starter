import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createFlowAgentMcpServer } from "./mcp-server";
import { flowAgentMcpToolNames } from "./mcp-tools";

describe("Flow Agent MCP server", () => {
  it("registers read-only MCP tools", () => {
    createFlowAgentMcpServer();
    assert.equal(flowAgentMcpToolNames.length, 4);
  });
});
