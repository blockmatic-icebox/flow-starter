import { getDb, loadRootEnv, searchRequests } from "@repo/fi";
import { defineEval } from "eve/evals";
import { satisfies } from "eve/evals/expect";

export default defineEval({
  description:
    "Lexical search surfaces Crewday shift-swap feedback from seeded fixtures.",
  tags: ["smoke"],
  async test(t) {
    loadRootEnv();
    const { items: rows } = await searchRequests({
      db: getDb(),
      pageSize: 10,
      query: "shift swap",
    });
    if (rows.length < 1) throw new Error("expected shift-swap seed rows");
    const joined = rows.map((r) => r.title.toLowerCase()).join(" ");
    await t.check(
      joined,
      satisfies((text) => /swap|shift/u.test(text), "shift-swap themed titles")
    );
    t.succeeded();
  },
});
