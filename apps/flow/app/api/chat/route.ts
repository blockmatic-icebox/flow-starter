import { convertToModelMessages, stepCountIs, streamText } from "ai";

import { parseChatRequest } from "@/app/_lib/flow-agent/chat-request-schema";
import { getFlowAgentChatTools } from "@/app/_lib/flow-agent/chat-tools";
import { deterministicFlowAgentResponse } from "@/app/_lib/flow-agent/deterministic-stream";
import type { CreateCapStoreResult } from "@/app/_lib/genui/create-cap-store";
import { enforceDailyCap } from "@/app/_lib/genui/enforce-daily-cap";
import {
  jsonErrorFromReadResult,
  jsonErrorResponse,
  readJsonRequest,
} from "@/app/_lib/security/read-json-request";

export const runtime = "nodejs";
export const maxDuration = 30;

const DEFAULT_MODEL = "anthropic/claude-sonnet-4";
const CHAT_MAX_BODY_BYTES = 128 * 1024;
const MAX_OUTPUT_TOKENS = 800;

const system = `You are the Flow Agent — assistant for Flow methodology and Flow Starter architecture.
Use the describe_* and knowledge tools for factual answers grounded in bundled repository docs.
Use focus_genui when the user wants the main Generative UI panel on the homepage.
Use toggle_theme when the user wants to change light or dark mode.
Distinguish apps/web (product starter) from apps/flow (Flow experience). Never claim full Better Auth, eve, or /dev workspace are shipped unless listed under planned in tool results.`;

const publicFailure = "Flow Agent could not complete that request.";

export const handleChatPost = async ({
  createStore,
  env = process.env,
  now = new Date(),
  request,
}: {
  createStore?: (input: { env: NodeJS.ProcessEnv }) => CreateCapStoreResult;
  env?: NodeJS.ProcessEnv;
  now?: Date;
  request: Request;
}) => {
  const body = await readJsonRequest({
    maxBytes: CHAT_MAX_BODY_BYTES,
    request,
  });
  if (!body.ok) return jsonErrorFromReadResult(body.error);

  const tools = getFlowAgentChatTools();
  const parsed = await parseChatRequest({ body: body.value, tools });
  if (!parsed.ok)
    return jsonErrorResponse({ message: parsed.message, status: 400 });

  const admitted = await enforceDailyCap({
    createStore,
    env,
    kind: "chat",
    now,
    request,
  });
  if (!admitted.ok)
    return jsonErrorResponse({
      message: admitted.message,
      status: admitted.status,
    });

  const apiKey = env.AI_GATEWAY_API_KEY?.trim();
  if (!apiKey) return deterministicFlowAgentResponse(parsed.messages);

  const model =
    env.CONSULTANT_MODEL?.trim() || env.GENUI_MODEL?.trim() || DEFAULT_MODEL;

  try {
    const messages = await convertToModelMessages(parsed.messages, { tools });
    const result = streamText({
      abortSignal: request.signal,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      maxRetries: 0,
      messages,
      model,
      onError: () => null,
      stopWhen: stepCountIs(5),
      system,
      tools,
    });
    return result.toUIMessageStreamResponse({
      onError: () => publicFailure,
      sendReasoning: false,
    });
  } catch {
    return jsonErrorResponse({ message: "Invalid chat request.", status: 400 });
  }
};

export const POST = (request: Request) => handleChatPost({ request });
