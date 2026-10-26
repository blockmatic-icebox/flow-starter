import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("POST /api/genui/compose", () => {
  it("rejects invalid body with 400", async () => {
    const { POST } = await import("../app/api/genui/compose/route");
    const response = await POST(
      new Request("http://localhost/api/genui/compose", {
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
    );
    assert.equal(response.status, 400);
  });
});
