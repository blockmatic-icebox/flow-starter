import { createDraftAndTriage, getDb, loadRootEnv } from "@repo/fi";
import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";

export default defineEval({
  description:
    "submit path leaves request in pending_confirm until explicit confirm (AG-7).",
  tags: ["smoke"],
  async test(t) {
    loadRootEnv();
    const db = getDb();
    const title = `Eval draft ${crypto.randomUUID().slice(0, 8)}`;
    const { request } = await createDraftAndTriage({
      db,
      description: "Eval-only description for AG-7 behavioral check.",
      source: "internal",
      title,
    });
    await t.require(request?.status ?? "", equals("pending_confirm"));
    t.succeeded();
  },
});
