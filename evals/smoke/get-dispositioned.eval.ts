import { getDb, getRequest, loadRootEnv } from "@repo/fi";
import { defineEval } from "eve/evals";
import { includes } from "eve/evals/expect";

export default defineEval({
  description:
    "Declined seed request includes disposition rationale on record.",
  tags: ["smoke"],
  async test(t) {
    loadRootEnv();
    const detail = await getRequest({
      db: getDb(),
      requestId: "00000000-0000-4000-8000-000000000008",
    });
    await t.check(
      detail?.request.dispositionRationale ?? "",
      includes("FR-006")
    );
    t.succeeded();
  },
});
