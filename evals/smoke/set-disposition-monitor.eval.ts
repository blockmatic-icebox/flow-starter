import {
  getDb,
  getRequest,
  listTriageQueue,
  loadRootEnv,
  setDisposition,
} from "@repo/fi";
import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";

export default defineEval({
  description: "setDisposition monitor persists rationale on a queue item.",
  tags: ["smoke"],
  async test(t) {
    loadRootEnv();
    const db = getDb();
    const [item] = await listTriageQueue({ db });
    if (!item) throw new Error("empty triage queue");
    await setDisposition({
      db,
      disposition: "monitor",
      dispositionRationale: "Eval monitor disposition",
      requestId: item.id,
    });
    const detail = await getRequest({ db, requestId: item.id });
    await t.require(detail?.request.disposition ?? "", equals("monitor"));
    await t.check(
      detail?.request.dispositionRationale ?? "",
      equals("Eval monitor disposition")
    );
    t.succeeded();
  },
});
