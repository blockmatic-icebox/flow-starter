import {
  confirmRequest,
  createDraftAndTriage,
  getDb,
  loadRootEnv,
} from "@repo/fi";
import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";

export default defineEval({
  description:
    "confirmRequest publishes an owned pending_confirm draft after explicit confirm.",
  tags: ["smoke"],
  async test(t) {
    loadRootEnv();
    const db = getDb();
    const title = `Eval confirm ${crypto.randomUUID().slice(0, 8)}`;
    const { request: draft } = await createDraftAndTriage({
      db,
      description: "Eval-only row for confirm-after-approval smoke.",
      source: "internal",
      title,
    });
    const requestId = draft?.id;
    if (!requestId) throw new Error("missing draft id");
    await t.require(draft?.status ?? "", equals("pending_confirm"));
    const published = await confirmRequest({ db, requestId });
    await t.require(published.status, equals("published"));
    t.succeeded();
  },
});
