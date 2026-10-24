import { convertToModelMessages, stepCountIs, streamText } from "ai";
import type { UIMessage } from "ai";
import { NextResponse } from "next/server";

import { admitChat } from "@/lib/consultant/admit-chat";
import { getConsultantChatTools } from "@/lib/consultant/chat-tools";
import { deterministicConsultantResponse } from "@/lib/consultant/deterministic-stream";
import { memoryCapStore } from "@/lib/genui/cap-store";
import {
  composeRateLimitEnforced,
  readRequestIp,
  requestHost,
} from "@/lib/genui/request";

export const runtime = "nodejs";
export const maxDuration = 30;

const DEFAULT_MODEL = "anthropic/claude-sonnet-4";
const capStore = memoryCapStore();

const system = `You are the Flow Starter technical consultant.
Use describe_architecture, describe_technologies, or describe_capabilities for factual questions about the starter.
Use open_genui_demo when the user wants to open or click the GenUI demo button.
Use toggle_theme when the user wants to change light or dark mode.
Never claim eve, Better Auth, Neon, or the /dev workspace are shipped unless a tool result explicitly lists them under planned.`;

export const POST = async (request: Request) => {
  const body = (await request.json().catch(() => null)) as {
    messages?: UIMessage[];
  } | null;
  const messages = body?.messages ?? [];
  if (messages.length === 0) {
    return NextResponse.json(
      { message: "Messages are required." },
      { status: 400 }
    );
  }

  const ip = readRequestIp(request);
  const host = requestHost(request);
  const admitted = await admitChat({
    enforce: composeRateLimitEnforced({ host }),
    ip,
    now: new Date(),
    store: capStore,
  });
  if (!admitted.ok) {
    return NextResponse.json({ message: admitted.message }, { status: 429 });
  }

  const apiKey = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!apiKey) {
    return deterministicConsultantResponse(messages);
  }

  const model =
    process.env.CONSULTANT_MODEL?.trim() ||
    process.env.GENUI_MODEL?.trim() ||
    DEFAULT_MODEL;

  const result = streamText({
    messages: await convertToModelMessages(messages),
    model,
    stopWhen: stepCountIs(5),
    system,
    tools: getConsultantChatTools(),
  });

  return result.toUIMessageStreamResponse({ sendReasoning: true });
};
