import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createConsultantMcpServer } from "./mcp-server";
import { consultantToolNames } from "./tools";

describe("consultant MCP server", () => {
  it("registers read-only consultant tools", () => {
    const server = createConsultantMcpServer();
    assert.ok(server);
    assert.equal(consultantToolNames.length, 3);
  });
});
