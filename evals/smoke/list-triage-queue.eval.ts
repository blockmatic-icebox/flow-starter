import { getDb, listTriageQueue, loadRootEnv } from "@repo/fi";
import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";

export default defineEval({
  description: "Seeded open triage queue has fifty items.",
  tags: ["smoke"],
  async test(t) {
    loadRootEnv();
    const queue = await listTriageQueue({ db: getDb() });
    await t.require(queue.length, equals(50));
    t.succeeded();
  },
});
