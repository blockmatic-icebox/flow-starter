import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

const fiAskOnlySystemPrompt = `You answer questions about the Feature Intelligence product: feature requests, triage, dispositions, metrics, and workflows.

You do not have access to live data or tools. You cannot submit, confirm, support, or disposition requests. If asked to change data, explain which screen or eve agent tool the user should use instead.

Use progressive disclosure: short answer first, then optional detail. End with 2–3 suggested next steps as plain bullets under "Next:".`;

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY?.trim())
    return new Response("ANTHROPIC_API_KEY is not configured", { status: 503 });

  const { messages } = (await req.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  const result = streamText({
    messages,
    model: anthropic(
      process.env.FI_CHAT_MODEL?.trim() ?? "claude-sonnet-4-20250514"
    ),
    system: fiAskOnlySystemPrompt,
  });

  return result.toUIMessageStreamResponse();
}
