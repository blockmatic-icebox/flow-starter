import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { readJsonRequest } from "./read-json-request";

const url = "http://localhost/api/test";

const requestWith = ({
  body,
  headers,
  signal,
}: {
  body?: BodyInit | null;
  headers?: HeadersInit;
  signal?: AbortSignal;
}) =>
  new Request(url, {
    body,
    headers,
    method: "POST",
    signal,
    ...(body instanceof ReadableStream ? { duplex: "half" } : {}),
  } as RequestInit & { duplex?: "half" });

const streamOf = (chunks: Uint8Array[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });

describe("readJsonRequest", () => {
  it("reads valid JSON", async () => {
    const result = await readJsonRequest({
      maxBytes: 1024,
      request: requestWith({
        body: JSON.stringify({ ok: true }),
        headers: { "content-type": "application/json" },
      }),
    });
    assert.deepEqual(result, { ok: true, value: { ok: true } });
  });

  it("rejects malformed JSON", async () => {
    const result = await readJsonRequest({
      maxBytes: 1024,
      request: requestWith({
        body: "{",
        headers: { "content-type": "application/json" },
      }),
    });
    assert.deepEqual(result, { error: "invalid_json", ok: false });
  });

  it("rejects a missing or invalid content type", async () => {
    const missing = await readJsonRequest({
      maxBytes: 1024,
      request: requestWith({ body: "{}" }),
    });
    const text = await readJsonRequest({
      maxBytes: 1024,
      request: requestWith({
        body: "{}",
        headers: { "content-type": "text/plain" },
      }),
    });
    assert.equal(missing.ok, false);
    assert.equal(text.ok, false);
    if (!missing.ok) assert.equal(missing.error, "unsupported_media_type");
    if (!text.ok) assert.equal(text.error, "unsupported_media_type");
  });

  it("accepts application/json with charset utf-8", async () => {
    const result = await readJsonRequest({
      maxBytes: 1024,
      request: requestWith({
        body: JSON.stringify({ query: "plans" }),
        headers: { "content-type": "application/json; charset=utf-8" },
      }),
    });
    assert.equal(result.ok, true);
  });

  it("rejects invalid UTF-8", async () => {
    const result = await readJsonRequest({
      maxBytes: 1024,
      request: requestWith({
        body: streamOf([new Uint8Array([0xff, 0xfe, 0xfd])]),
        headers: { "content-type": "application/json" },
      }),
    });
    assert.deepEqual(result, { error: "invalid_json", ok: false });
  });

  it("stops when one chunk exceeds the limit", async () => {
    const result = await readJsonRequest({
      maxBytes: 16,
      request: requestWith({
        body: streamOf([new Uint8Array(17)]),
        headers: { "content-type": "application/json" },
      }),
    });
    assert.deepEqual(result, { error: "payload_too_large", ok: false });
  });

  it("stops when multiple chunks exceed the limit", async () => {
    const encoder = new TextEncoder();
    const result = await readJsonRequest({
      maxBytes: 12,
      request: requestWith({
        body: streamOf([
          encoder.encode('{"query":'),
          encoder.encode('"abcdefghij"}'),
        ]),
        headers: { "content-type": "application/json" },
      }),
    });
    assert.deepEqual(result, { error: "payload_too_large", ok: false });
  });

  it("rejects an oversized Content-Length before trusting the body", async () => {
    const result = await readJsonRequest({
      maxBytes: 32,
      request: requestWith({
        body: "{}",
        headers: {
          "content-length": "9999",
          "content-type": "application/json",
        },
      }),
    });
    assert.deepEqual(result, { error: "payload_too_large", ok: false });
  });

  it("returns aborted when the request is cancelled", async () => {
    const controller = new AbortController();
    const body = new ReadableStream({
      start() {
        controller.abort();
      },
    });
    const result = await readJsonRequest({
      maxBytes: 1024,
      request: requestWith({
        body,
        headers: { "content-type": "application/json" },
        signal: controller.signal,
      }),
    });
    assert.deepEqual(result, { error: "aborted", ok: false });
  });

  it("rejects an empty body", async () => {
    const result = await readJsonRequest({
      maxBytes: 1024,
      request: requestWith({
        body: "",
        headers: { "content-type": "application/json" },
      }),
    });
    assert.deepEqual(result, { error: "invalid_json", ok: false });
  });
});
