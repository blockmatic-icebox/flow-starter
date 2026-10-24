import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { flowStarterFacts } from "./facts";
import { flowAgentMcpToolNames } from "./mcp-tools";
import { pickFlowAgentTool, runFlowAgentTool } from "./tools";

describe("Flow Agent facts", () => {
  it("separates shipped from planned capabilities", () => {
    const shipped = flowStarterFacts.shipped.join(" ").toLowerCase();
    assert.ok(shipped.includes("apps/flow"));
    assert.ok(shipped.includes("apps/web"));
    const planned = flowStarterFacts.planned.join(" ").toLowerCase();
    assert.ok(planned.includes("better auth"));
  });
});

describe("Flow Agent tools", () => {
  it("picks workflow questions", () => {
    assert.equal(
      pickFlowAgentTool("Explain Explore Specify Plan Build Review Ship"),
      "describe_workflow"
    );
  });

  it("returns architecture text", () => {
    const text = runFlowAgentTool("describe_architecture");
    assert.match(text, /apps\/web/iu);
    assert.match(text, /apps\/flow/iu);
  });

  it("exposes four MCP tools", () => {
    assert.equal(flowAgentMcpToolNames.length, 4);
  });
});
