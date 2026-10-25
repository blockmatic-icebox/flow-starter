import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { headlessCursorAgentAdapter } from "./headless-cursor-agent.ts";

describe("headless Cursor agent adapter", () => {
  it("preflight blocks without FLOW_EVAL_MODEL_ID", () => {
    const prior = process.env.FLOW_EVAL_MODEL_ID;
    delete process.env.FLOW_EVAL_MODEL_ID;
    const result = headlessCursorAgentAdapter.preflight();
    if (!result.ok)
      assert.ok(
        /FLOW_EVAL_MODEL_ID|agent CLI/u.test(result.reason),
        result.reason
      );
    if (prior) process.env.FLOW_EVAL_MODEL_ID = prior;
  });
});
