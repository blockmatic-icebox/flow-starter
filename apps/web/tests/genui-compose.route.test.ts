import assert from "node:assert/strict";
import { describe, it } from "node:test";

const crewdayStarterQuery =
  "What scheduling problems should Crewday prioritize next?";

const readNdjsonUntilSettled = async (
  body: ReadableStream<Uint8Array> | null,
  timeoutMs: number
) => {
  if (!body) return "";
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  const deadline = Date.now() + timeoutMs;
  try {
    while (Date.now() < deadline) {
      // oxlint-disable-next-line eslint/no-await-in-loop -- NDJSON stream must be read sequentially
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      if (/"type":"complete"/u.test(text) || /"type":"error"/u.test(text))
        break;
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return text;
};

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

  it("accepts Crewday starter body and streams NDJSON", async (t) => {
    if (!process.env.DATABASE_URL?.trim()) {
      t.skip("DATABASE_URL required for compose route integration");
      return;
    }
    if (process.env.FI_COMPOSE_ROUTE_LIVE !== "1") {
      t.skip("Set FI_COMPOSE_ROUTE_LIVE=1 for live compose route integration");
      return;
    }
    const { POST } = await import("../app/api/genui/compose/route");
    const response = await POST(
      new Request("http://localhost/api/genui/compose", {
        body: JSON.stringify({
          clientRequestId: "crewday-compose-1",
          query: crewdayStarterQuery,
          version: 1,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: AbortSignal.timeout(20_000),
      })
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Content-Type"), "application/x-ndjson");
    const text = await readNdjsonUntilSettled(response.body, 18_000);
    assert.ok(text.length > 0, "expected NDJSON body before timeout");
    assert.match(text, /"type":"(?:start|partial|complete)"/u);
    assert.match(text, /envelope/u);
  });
});
