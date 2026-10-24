import { composeQuery } from "@repo/genui";
import { NextResponse } from "next/server";

import { composeContextFromRequest } from "@/app/_lib/genui/compose-context";
import {
  composeRequestErrorMessage,
  composeRequestSchema,
} from "@/app/_lib/genui/compose-request-schema";
import type { CreateCapStoreResult } from "@/app/_lib/genui/create-cap-store";
import { enforceDailyCap } from "@/app/_lib/genui/enforce-daily-cap";
import { rateLimitSubject } from "@/app/_lib/genui/request";
import {
  jsonRequestMessage,
  jsonRequestStatus,
  readJsonRequest,
} from "@/app/_lib/security/read-json-request";

export const runtime = "nodejs";

const DEADLINE_MS = 15_000;
export const COMPOSE_MAX_BODY_BYTES = 16 * 1024;

const jsonError = ({ message, status }: { message: string; status: number }) =>
  NextResponse.json({ message }, { status });

export const handleComposePost = async ({
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
    maxBytes: COMPOSE_MAX_BODY_BYTES,
    request,
  });
  if (!body.ok)
    return jsonError({
      message: jsonRequestMessage(body.error),
      status: jsonRequestStatus(body.error),
    });

  const parsed = composeRequestSchema.safeParse(body.value);
  if (!parsed.success)
    return jsonError({
      message: composeRequestErrorMessage(parsed.error),
      status: 400,
    });

  const admitted = await enforceDailyCap({
    createStore,
    env,
    kind: "compose",
    now,
    request,
  });
  if (!admitted.ok)
    return jsonError({ message: admitted.message, status: admitted.status });

  const correlationId = parsed.data.clientRequestId ?? crypto.randomUUID();
  const context = composeContextFromRequest({
    correlationId,
    subject: rateLimitSubject({ env, request }),
  });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const abortController = new AbortController();
      const onAbort = () => abortController.abort();
      request.signal.addEventListener("abort", onAbort);
      const deadline = setTimeout(() => abortController.abort(), DEADLINE_MS);
      try {
        await composeQuery({
          input: {
            clientRequestId: context.correlationId,
            query: parsed.data.query,
            version: parsed.data.version ?? 1,
          },
          onEvent: (event) => {
            if (abortController.signal.aborted) return;
            controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
          },
          signal: abortController.signal,
        });
      } catch {
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({
              message: "Composition failed.",
              requestId: context.correlationId,
              sequence: 0,
              type: "error",
            })}\n`
          )
        );
      } finally {
        clearTimeout(deadline);
        request.signal.removeEventListener("abort", onAbort);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/x-ndjson",
    },
  });
};

export const POST = (request: Request) => handleComposePost({ request });
