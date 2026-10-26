import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

import { jsonError, withExtraHeaders } from "@/lib/api/json-error";
import { discoveryRateLimitHeaders } from "@/lib/api/rate-limit-headers";

const systemPrompt = `You assist users building agentic application UIs in this starter.

You can explain GenUI, MCP compose_ui, and Eve tools. You do not mutate remote systems.
When users want a new screen, suggest they use the studio prompt or compose_ui with a clear UI description.

Keep answers concise. Use bullets for next steps when helpful.`;

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const GET = () =>
  withExtraHeaders(
    jsonError({
      code: "method_not_allowed",
      message: "Use POST with a messages array.",
      resolution: "POST /api/chat with Content-Type application/json.",
      status: 405,
    }),
    discoveryRateLimitHeaders()
  );

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY?.trim())
    return jsonError({
      code: "chat_unavailable",
      message: "ANTHROPIC_API_KEY is not configured.",
      resolution:
        "Configure ANTHROPIC_API_KEY on the deployment or use MCP tools instead.",
      status: 503,
    });

  let messages: { role: "user" | "assistant"; content: string }[];
  try {
    const body = (await req.json()) as {
      messages?: { role: "user" | "assistant"; content: string }[];
    };
    const { messages: parsed } = body;
    if (!parsed?.length)
      return jsonError({
        code: "invalid_request",
        message: "Request body must include a non-empty messages array.",
        resolution: "See /openapi.json.",
        status: 400,
      });
    messages = parsed;
  } catch {
    return jsonError({
      code: "invalid_json",
      message: "Request body must be valid JSON.",
      resolution: "Send Content-Type application/json.",
      status: 400,
    });
  }

  const result = streamText({
    messages,
    model: anthropic(
      process.env.CHAT_MODEL?.trim() ?? "claude-sonnet-4-20250514"
    ),
    system: systemPrompt,
  });

  return result.toUIMessageStreamResponse();
}
