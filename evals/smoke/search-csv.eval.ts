import { getDb, loadRootEnv, searchRequests } from "@repo/fi";
import { defineEval } from "eve/evals";
import { includes } from "eve/evals/expect";

export default defineEval({
  description: "Lexical search surfaces CSV-related seeded requests.",
  tags: ["smoke"],
  async test(t) {
    loadRootEnv();
    const rows = await searchRequests({
      db: getDb(),
      limit: 10,
      query: "CSV",
    });
    if (rows.length < 1) throw new Error("expected CSV-related seed rows");
    const joined = rows.map((r) => r.title.toLowerCase()).join(" ");
    await t.check(joined, includes("csv"));
    t.succeeded();
  },
});
