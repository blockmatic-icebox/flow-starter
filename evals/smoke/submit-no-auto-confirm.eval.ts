import { readFile } from "node:fs/promises";
import path from "node:path";

import { defineEval } from "eve/evals";
import { equals, includes } from "eve/evals/expect";

export default defineEval({
  description:
    "submit_request tool does not call confirmRequest in the same module (AG-7).",
  tags: ["smoke"],
  async test(t) {
    const source = await readFile(
      path.join(process.cwd(), "agent/tools/submit-request.ts"),
      "utf-8"
    );
    t.check(source, includes("pending_confirm"));
    await t.require(source.includes("confirmRequest("), equals(false));
    t.succeeded();
  },
});
