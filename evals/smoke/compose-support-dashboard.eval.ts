import assert from "node:assert/strict";

import { defineEval } from "eve/evals";
import type { ToolContext } from "eve/tools";

import composeUi from "../../agent/tools/compose-ui.ts";

export default defineEval({
  description: "compose-ui tool returns validated support dashboard envelope",
  tags: ["smoke"],
  async test(t) {
    const result = await composeUi.execute(
      {
        mode: "create",
        query: "Generate a customer support dashboard",
      },
      {} as ToolContext
    );

    assert.ok("envelope" in result);
    assert.equal(result.metadata.outcome, "success");
    assert.match(result.envelope.openuiText, /SectionStack/u);
    assert.match(result.envelope.openuiText, /metrics-dashboard/u);

    t.succeeded();
  },
});
