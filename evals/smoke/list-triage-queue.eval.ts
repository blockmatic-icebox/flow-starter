import { getDb, listTriageQueue, loadRootEnv } from "@repo/fi";
import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";

import { OPEN_QUEUE_COUNT } from "../../packages/fi/seed/manifest.js";

export default defineEval({
  description:
    "Open triage queue includes seeded Crewday baseline; owned smoke rows may add more.",
  tags: ["smoke"],
  async test(t) {
    loadRootEnv();
    const queue = await listTriageQueue({ db: getDb() });
    await t.check(queue.length >= OPEN_QUEUE_COUNT, equals(true));
    await t.check(
      queue.every((row) => row.status === "published" && !row.disposition),
      equals(true)
    );
    t.succeeded();
  },
});
