import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { composeQuery } from "./compose";
import { defaultEntityIds } from "./routing";

describe("composeQuery", () => {
  it("routes compare plans to tier 1", async () => {
    const result = await composeQuery({
      input: {
        clientRequestId: "t1",
        query: "Compare Orbit plan versus Nova plan",
        version: 1,
      },
    });
    assert.equal(result.metadata.tier, 1);
    assert.equal(result.metadata.validationOk, true);
    assert.equal(result.metadata.component, "ComparisonView");
  });

  it("composes tier 2 stack for compound prompts", async () => {
    const result = await composeQuery({
      input: {
        clientRequestId: "t2",
        query: "Explain the API and show revenue metrics",
        version: 1,
      },
    });
    assert.equal(result.metadata.tier, 2);
    assert.equal(result.metadata.validationOk, true);
  });

  it("returns the mobile entity for mobile search", async () => {
    const result = await composeQuery({
      input: {
        clientRequestId: "search-mobile",
        query: "search mobile products",
        version: 1,
      },
    });

    const complete = result.events.find((event) => event.type === "complete");

    assert.ok(complete && complete.type === "complete");
    assert.equal(result.metadata.tier, 1);
    assert.equal(result.metadata.validationOk, true);
    assert.match(complete.envelope.openuiText, /entity:pulse-mobile/u);
  });

  it("returns the default catalog entities for non-mobile search", async () => {
    const result = await composeQuery({
      input: {
        clientRequestId: "search-general",
        query: "search products",
        version: 1,
      },
    });

    const complete = result.events.find((event) => event.type === "complete");

    assert.ok(complete && complete.type === "complete");
    assert.equal(result.metadata.tier, 1);
    assert.equal(result.metadata.validationOk, true);

    const text = complete.envelope.openuiText;
    const expected = defaultEntityIds().slice(0, 2);

    for (const id of expected) {
      assert.ok(text.includes(id));
    }

    assert.ok(!text.includes("entity:pulse-mobile"));
  });

  it("does not attach invented citations to tier 3 fallback answers", async () => {
    const previous = process.env.AI_GATEWAY_API_KEY;

    process.env.AI_GATEWAY_API_KEY = "";

    try {
      const result = await composeQuery({
        input: {
          clientRequestId: "general-uncited",
          query: "Design a completely novel interface",
          version: 1,
        },
      });

      const complete = result.events.find((event) => event.type === "complete");

      assert.ok(complete && complete.type === "complete");
      assert.equal(result.metadata.tier, 3);
      assert.equal(result.metadata.validationOk, true);
      assert.equal(result.modelCalls, 0);

      assert.match(complete.envelope.openuiText, /,\s*\[\]\)$/u);
      assert.ok(
        !complete.envelope.openuiText.includes("document:api-overview")
      );
    } finally {
      if (previous === undefined) {
        delete process.env.AI_GATEWAY_API_KEY;
      } else {
        process.env.AI_GATEWAY_API_KEY = previous;
      }
    }
  });
});
