import { composeQuery } from "@repo/genui";

import { composeContextFromRequest } from "@/app/_lib/genui/compose-context";
import {
  flowWorkflowCompositionEnvelope,
  isFlowMethodologyQuery,
} from "@/app/_lib/genui/compose-flow-answer";
import {
  composeRequestErrorMessage,
  composeRequestSchema,
} from "@/app/_lib/genui/compose-request-schema";
import type { CreateCapStoreResult } from "@/app/_lib/genui/create-cap-store";
import { enforceDailyCap } from "@/app/_lib/genui/enforce-daily-cap";
import { rateLimitIdentity } from "@/app/_lib/genui/request";
import {
  jsonErrorFromReadResult,
  jsonErrorResponse,
  readJsonRequest,
} from "@/app/_lib/security/read-json-request";

export const runtime = "nodejs";

const DEADLINE_MS = 15_000;
export const COMPOSE_MAX_BODY_BYTES = 16 * 1024;

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
  if (!body.ok) return jsonErrorFromReadResult(body.error);

  const parsed = composeRequestSchema.safeParse(body.value);
  if (!parsed.success)
    return jsonErrorResponse({
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
    return jsonErrorResponse({
      message: admitted.message,
      status: admitted.status,
    });

  const correlationId = parsed.data.clientRequestId ?? crypto.randomUUID();
  const identity = rateLimitIdentity({ env, request });
  const context = composeContextFromRequest({
    correlationId,
    subject: identity.ok ? identity.subject : "shared",
  });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const abortController = new AbortController();
      const onAbort = () => abortController.abort();
      request.signal.addEventListener("abort", onAbort);
      const deadline = setTimeout(() => abortController.abort(), DEADLINE_MS);
      try {
        const emit = (event: Record<string, unknown>) => {
          if (abortController.signal.aborted) return;
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        };
        if (isFlowMethodologyQuery(parsed.data.query)) {
          const requestId = context.correlationId;
          const envelope = flowWorkflowCompositionEnvelope({ requestId });
          emit({ requestId, sequence: 0, type: "start" });
          emit({ envelope, requestId, sequence: 1, type: "partial" });
          emit({ envelope, requestId, sequence: 2, type: "complete" });
        } else {
          await composeQuery({
            input: {
              clientRequestId: context.correlationId,
              query: parsed.data.query,
              version: parsed.data.version ?? 1,
            },
            onEvent: (event) => emit(event),
            signal: abortController.signal,
          });
        }
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
