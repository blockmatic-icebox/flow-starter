import assert from "node:assert/strict";
import { describe, it } from "node:test";

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

  it("streams NDJSON for support dashboard query without database", async () => {
    const { POST } = await import("../app/api/genui/compose/route");
    const response = await POST(
      new Request("http://localhost/api/genui/compose", {
        body: JSON.stringify({
          clientRequestId: "route-test-1",
          query: "customer support dashboard",
          version: 1,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
    );
    assert.equal(response.status, 200);
    const text = await readNdjsonUntilSettled(response.body, 5000);
    assert.match(text, /"type":"complete"/u);
    assert.match(text, /SectionStack|DataExplorer/u);
  });
});
