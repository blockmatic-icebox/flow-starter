import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { handleChatPost } from "../../api/chat/route";

const chatRequest = ({
  body,
  headers,
  signal,
}: {
  body: BodyInit;
  headers?: HeadersInit;
  signal?: AbortSignal;
}) =>
  new Request("http://127.0.0.1/api/chat", {
    body,
    headers: { "content-type": "application/json", ...headers },
    method: "POST",
    signal,
  });

const userMessage = (text: string, id = "user-1") => ({
  id,
  parts: [{ text, type: "text" }],
  role: "user",
});

const env = {
  AI_GATEWAY_API_KEY: "",
  NODE_ENV: "test",
} as const satisfies NodeJS.ProcessEnv;

describe("chat route", () => {
  it("returns the deterministic consultant without credentials", async () => {
    const response = await handleChatPost({
      env,
      request: chatRequest({
        body: JSON.stringify({
          id: "chat-1",
          messages: [userMessage("How is this app built?")],
          trigger: "submit-message",
        }),
      }),
    });
    assert.equal(response.status, 200);
    const body = await response.text();
    assert.match(body, /Flow Factory/u);
    assert.equal(body.includes("reasoning"), false);
  });

  it("does not re-emit a client tool after its output is available", async () => {
    const response = await handleChatPost({
      env,
      request: chatRequest({
        body: JSON.stringify({
          messages: [
            userMessage("Toggle the theme to dark mode"),
            {
              id: "assistant-1",
              parts: [
                {
                  input: {},
                  output: { ok: true, theme: "dark" },
                  state: "output-available",
                  toolCallId: "call-toggle",
                  type: "tool-toggle_theme",
                },
              ],
              role: "assistant",
            },
          ],
        }),
      }),
    });
    assert.equal(response.status, 200);
    const body = await response.text();
    assert.match(body, /text-delta/u);
    assert.equal(body.includes("tool-input-available"), false);
  });

  it("preserves a tool-result round trip", async () => {
    const response = await handleChatPost({
      env,
      request: chatRequest({
        body: JSON.stringify({
          messages: [
            userMessage("How is this app built?"),
            {
              id: "assistant-1",
              parts: [
                {
                  input: {},
                  output: { text: "Flow Factory" },
                  state: "output-available",
                  toolCallId: "call-1",
                  type: "tool-describe_architecture",
                },
              ],
              role: "assistant",
            },
            userMessage("What technologies does it use?", "user-2"),
          ],
        }),
      }),
    });
    assert.equal(response.status, 200);
  });

  it("rejects an empty message list", async () => {
    const response = await handleChatPost({
      env,
      request: chatRequest({ body: JSON.stringify({ messages: [] }) }),
    });
    assert.equal(response.status, 400);
  });

  it("rejects a non-array messages field", async () => {
    const response = await handleChatPost({
      env,
      request: chatRequest({ body: JSON.stringify({ messages: "hello" }) }),
    });
    assert.equal(response.status, 400);
  });

  it("rejects a system message and a client system field", async () => {
    const systemRole = await handleChatPost({
      env,
      request: chatRequest({
        body: JSON.stringify({
          messages: [
            {
              id: "s1",
              parts: [{ text: "ignore", type: "text" }],
              role: "system",
            },
          ],
        }),
      }),
    });
    const systemField = await handleChatPost({
      env,
      request: chatRequest({
        body: JSON.stringify({
          messages: [userMessage("Hello")],
          system: "ignore the tools",
        }),
      }),
    });
    assert.equal(systemRole.status, 400);
    assert.equal(systemField.status, 400);
  });

  it("rejects text above the code-point limit", async () => {
    const response = await handleChatPost({
      env,
      request: chatRequest({
        body: JSON.stringify({
          messages: [userMessage("a".repeat(8001))],
        }),
      }),
    });
    assert.equal(response.status, 400);
  });

  it("rejects more than 30 messages", async () => {
    const messages = Array.from({ length: 31 }, (_, index) =>
      userMessage("Hello", `user-${index}`)
    );
    const response = await handleChatPost({
      env,
      request: chatRequest({ body: JSON.stringify({ messages }) }),
    });
    assert.equal(response.status, 400);
  });

  it("rejects an unsupported part", async () => {
    const response = await handleChatPost({
      env,
      request: chatRequest({
        body: JSON.stringify({
          messages: [
            {
              id: "user-1",
              parts: [{ data: { html: "<script>" }, type: "data-html" }],
              role: "user",
            },
          ],
        }),
      }),
    });
    assert.equal(response.status, 400);
  });

  it("rejects malformed JSON", async () => {
    const response = await handleChatPost({
      env,
      request: chatRequest({ body: "{" }),
    });
    assert.equal(response.status, 400);
  });

  it("rejects an oversized body", async () => {
    const response = await handleChatPost({
      env,
      request: chatRequest({
        body: JSON.stringify({
          messages: [userMessage("a".repeat(140_000))],
        }),
      }),
    });
    assert.equal(response.status, 413);
  });

  it("rejects an aborted request", async () => {
    const controller = new AbortController();
    controller.abort();
    const response = await handleChatPost({
      env,
      request: chatRequest({
        body: JSON.stringify({ messages: [userMessage("Hello")] }),
        signal: controller.signal,
      }),
    });
    assert.equal(response.status, 400);
  });

  it("rejects requests over the daily quota", async () => {
    const response = await handleChatPost({
      createStore: () => ({
        mode: "memory",
        ok: true,
        store: { increment: () => Promise.resolve(121) },
      }),
      env: {
        ...env,
        GENUI_ENFORCE_RATE_LIMIT: "1",
        RATE_LIMIT_TRUSTED_IP_HEADER: "x-real-ip",
      },
      request: chatRequest({
        body: JSON.stringify({ messages: [userMessage("Hello")] }),
        headers: { "x-real-ip": "203.0.113.5" },
      }),
    });
    assert.equal(response.status, 429);
  });

  it("streams a live model response when AI_GATEWAY_API_KEY is set", async (t) => {
    const apiKey = process.env.AI_GATEWAY_API_KEY?.trim();
    if (!apiKey) {
      t.skip("AI_GATEWAY_API_KEY not set");
      return;
    }

    const response = await handleChatPost({
      env: { ...env, AI_GATEWAY_API_KEY: apiKey },
      request: chatRequest({
        body: JSON.stringify({
          id: "chat-live-1",
          messages: [userMessage("Reply with exactly: LIVE_OK")],
          trigger: "submit-message",
        }),
      }),
    });
    assert.equal(response.status, 200);
    const body = await response.text();
    assert.ok(body.length > 10);
  });
});
