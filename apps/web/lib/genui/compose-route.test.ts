import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { handleComposePost } from "../../app/api/genui/compose/route";

const jsonRequest = ({
  body,
  headers,
  signal,
}: {
  body: BodyInit;
  headers?: HeadersInit;
  signal?: AbortSignal;
}) =>
  new Request("http://127.0.0.1/api/genui/compose", {
    body,
    headers: { "content-type": "application/json", ...headers },
    method: "POST",
    signal,
  });

const eventsFrom = async (response: Response) => {
  const text = await response.text();
  return text
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as { type: string });
};

describe("compose route", () => {
  it("rejects an empty query", async () => {
    const response = await handleComposePost({
      env: { NODE_ENV: "test" },
      request: jsonRequest({ body: JSON.stringify({ query: "   " }) }),
    });
    assert.equal(response.status, 400);
    const body = (await response.json()) as { message: string };
    assert.match(body.message, /query/iu);
  });

  it("rejects a non-string query", async () => {
    const response = await handleComposePost({
      env: { NODE_ENV: "test" },
      request: jsonRequest({ body: JSON.stringify({ query: 1 }) }),
    });
    assert.equal(response.status, 400);
  });

  it("rejects a query above the maximum", async () => {
    const response = await handleComposePost({
      env: { NODE_ENV: "test" },
      request: jsonRequest({
        body: JSON.stringify({ query: "a".repeat(2001) }),
      }),
    });
    assert.equal(response.status, 400);
    const body = (await response.json()) as { message: string };
    assert.match(body.message, /too long/iu);
  });

  it("rejects an invalid clientRequestId", async () => {
    const response = await handleComposePost({
      env: { NODE_ENV: "test" },
      request: jsonRequest({
        body: JSON.stringify({
          clientRequestId: "not valid",
          query: "Compare Orbit plan versus Nova plan",
        }),
      }),
    });
    assert.equal(response.status, 400);
  });

  it("rejects an unsupported version", async () => {
    const response = await handleComposePost({
      env: { NODE_ENV: "test" },
      request: jsonRequest({
        body: JSON.stringify({
          query: "Compare Orbit plan versus Nova plan",
          version: 2,
        }),
      }),
    });
    assert.equal(response.status, 400);
  });

  it("rejects malformed JSON", async () => {
    const response = await handleComposePost({
      env: { NODE_ENV: "test" },
      request: jsonRequest({ body: "{" }),
    });
    assert.equal(response.status, 400);
  });

  it("rejects an oversized request", async () => {
    const response = await handleComposePost({
      env: { NODE_ENV: "test" },
      request: jsonRequest({
        body: JSON.stringify({ query: "a".repeat(20_000) }),
      }),
    });
    assert.equal(response.status, 413);
  });

  it("streams a validated deterministic composition", async () => {
    const response = await handleComposePost({
      env: { AI_GATEWAY_API_KEY: "", NODE_ENV: "test" },
      request: jsonRequest({
        body: JSON.stringify({
          query: "Compare Orbit plan versus Nova plan",
        }),
      }),
    });
    assert.equal(response.status, 200);
    const events = await eventsFrom(response);
    assert.deepEqual(
      events.map((event) => event.type),
      ["start", "partial", "complete"]
    );
  });

  it("rejects an aborted request", async () => {
    const controller = new AbortController();
    controller.abort();
    const response = await handleComposePost({
      env: { NODE_ENV: "test" },
      request: jsonRequest({
        body: JSON.stringify({ query: "Compare Orbit plan versus Nova plan" }),
        signal: controller.signal,
      }),
    });
    assert.equal(response.status, 400);
  });

  it("rejects requests over the daily quota", async () => {
    const response = await handleComposePost({
      createStore: () => ({
        mode: "memory",
        ok: true,
        store: { increment: () => Promise.resolve(61) },
      }),
      env: { GENUI_ENFORCE_RATE_LIMIT: "1", NODE_ENV: "test" },
      request: jsonRequest({
        body: JSON.stringify({ query: "Compare Orbit plan versus Nova plan" }),
      }),
    });
    assert.equal(response.status, 429);
  });

  it("fails closed when production rate-limit storage is missing", async () => {
    const response = await handleComposePost({
      env: { NODE_ENV: "production" },
      request: jsonRequest({
        body: JSON.stringify({ query: "Compare Orbit plan versus Nova plan" }),
      }),
    });
    assert.equal(response.status, 503);
    const body = (await response.json()) as { message: string };
    assert.equal(body.message.includes("UPSTASH"), false);
  });
});
