import {
  confirmRequest,
  createDraftAndTriage,
  getDb,
  getRequest,
  loadRootEnv,
  setDisposition,
} from "@repo/fi";
import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";

export default defineEval({
  description:
    "setDisposition monitor persists rationale on an owned published request.",
  tags: ["smoke"],
  async test(t) {
    loadRootEnv();
    const db = getDb();
    const title = `Eval monitor ${crypto.randomUUID().slice(0, 8)}`;
    const { request: draft } = await createDraftAndTriage({
      db,
      description: "Eval-only row for monitor disposition smoke.",
      source: "internal",
      title,
    });
    const requestId = draft?.id;
    if (!requestId) throw new Error("missing draft id");
    await confirmRequest({ db, requestId });
    await setDisposition({
      db,
      disposition: "monitor",
      dispositionRationale: "Eval monitor disposition",
      requestId,
    });
    const detail = await getRequest({ db, requestId });
    await t.require(detail?.request.disposition ?? "", equals("monitor"));
    await t.check(
      detail?.request.dispositionRationale ?? "",
      equals("Eval monitor disposition")
    );
    t.succeeded();
  },
});
