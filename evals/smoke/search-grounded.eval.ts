import { getDb, getRequest, loadRootEnv, searchRequests } from "@repo/fi";
import { defineEval } from "eve/evals";
import { equals, satisfies } from "eve/evals/expect";

const SEED_FR001 = "00000000-0000-4000-8000-000000000001";

export default defineEval({
  description:
    "search_requests domain path returns non-empty seeded rows grounded by id.",
  tags: ["smoke"],
  async test(t) {
    loadRootEnv();
    if (!process.env.DATABASE_URL?.trim())
      t.skip("DATABASE_URL not set; search grounding requires seeded DB");

    const { items: rows, total } = await searchRequests({
      db: getDb(),
      pageSize: 10,
      query: "CSV",
    });
    await t.require(
      total,
      satisfies((n) => n > 0, "non-empty total")
    );
    await t.require(
      rows.length,
      satisfies((n) => n > 0, "non-empty page")
    );
    const ids = rows.map((r) => r.id);
    await t.require(
      ids.includes(SEED_FR001) ? "grounded" : "",
      equals("grounded")
    );
    const anchored = await getRequest({
      db: getDb(),
      requestId: SEED_FR001,
    });
    await t.check(anchored?.request.title ?? "", satisfies(Boolean, "title"));
    t.succeeded();
  },
});
