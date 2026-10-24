import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { z } from "zod";

import { createActionRegistry, validateActionInvocation } from "./actions";

describe("action registry", () => {
  it("rejects unknown actions", () => {
    const registry = createActionRegistry();
    const result = validateActionInvocation({
      invocation: { actionId: "missing", input: {} },
      registry,
    });
    assert.equal(result.ok, false);
  });

  it("validates registered action input", () => {
    const registry = createActionRegistry();
    registry.register({
      description: "Filter table",
      id: "filter-table",
      inputSchema: z.object({ column: z.string() }),
      kind: "filter",
    });
    const result = validateActionInvocation({
      invocation: { actionId: "filter-table", input: { column: "name" } },
      registry,
    });
    assert.equal(result.ok, true);
  });
});
