import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

import { jsonError } from "@/lib/api/json-error";

const fiAskOnlySystemPrompt = `You answer questions about the Feature Intelligence product: feature requests, triage, dispositions, metrics, and workflows.

You do not have access to live data or tools. You cannot submit, confirm, support, or disposition requests. If asked to change data, explain which screen or eve agent tool the user should use instead.

Use progressive disclosure: short answer first, then optional detail. End with 2–3 suggested next steps as plain bullets under "Next:".`;

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const GET = () =>
  jsonError({
    code: "method_not_allowed",
    message: "Use POST with a messages array.",
    resolution: "POST /api/chat with Content-Type application/json.",
    status: 405,
  });

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
        resolution: "See /openapi.json operation fiAskOnlyChat.",
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
      process.env.FI_CHAT_MODEL?.trim() ?? "claude-sonnet-4-20250514"
    ),
    system: fiAskOnlySystemPrompt,
  });

  return result.toUIMessageStreamResponse();
}
