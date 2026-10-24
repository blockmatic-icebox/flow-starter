import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { NextResponse } from "next/server";

import { parseChatRequest } from "@/lib/consultant/chat-request-schema";
import { getConsultantChatTools } from "@/lib/consultant/chat-tools";
import { deterministicConsultantResponse } from "@/lib/consultant/deterministic-stream";
import type { CreateCapStoreResult } from "@/lib/genui/create-cap-store";
import { enforceDailyCap } from "@/lib/genui/enforce-daily-cap";
import {
  jsonRequestMessage,
  jsonRequestStatus,
  readJsonRequest,
} from "@/lib/security/read-json-request";

export const runtime = "nodejs";
export const maxDuration = 30;

const DEFAULT_MODEL = "anthropic/claude-sonnet-4";
const CHAT_MAX_BODY_BYTES = 128 * 1024;
const MAX_OUTPUT_TOKENS = 800;

const system = `You are the Flow Starter technical consultant.
Use describe_architecture, describe_technologies, or describe_capabilities for factual questions about the starter.
Use open_genui_demo when the user wants to open or click the GenUI demo button.
Use toggle_theme when the user wants to change light or dark mode.
Never claim eve, Better Auth, the /dev workspace, or Neon preview-branch automation are shipped unless a tool result explicitly lists them under planned. @repo/db, Drizzle migrations, and Neon Local are shipped baseline; apps/web does not require a database for the GenUI demo.`;

const jsonError = ({ message, status }: { message: string; status: number }) =>
  NextResponse.json({ message }, { status });

const publicFailure = "The consultant could not complete that request.";

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
  if (!body.ok)
    return jsonError({
      message: jsonRequestMessage(body.error),
      status: jsonRequestStatus(body.error),
    });

  const tools = getConsultantChatTools();
  const parsed = await parseChatRequest({ body: body.value, tools });
  if (!parsed.ok) return jsonError({ message: parsed.message, status: 400 });

  const admitted = await enforceDailyCap({
    createStore,
    env,
    kind: "chat",
    now,
    request,
  });
  if (!admitted.ok)
    return jsonError({ message: admitted.message, status: admitted.status });

  const apiKey = env.AI_GATEWAY_API_KEY?.trim();
  if (!apiKey) return deterministicConsultantResponse(parsed.messages);

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
    return jsonError({ message: "Invalid chat request.", status: 400 });
  }
};

export const POST = (request: Request) => handleChatPost({ request });
