import { composeQuery } from "@repo/genui";
import { NextResponse } from "next/server";

import { admitCompose } from "@/lib/genui/admit-compose";
import { memoryCapStore } from "@/lib/genui/cap-store";
import { composeContextFromRequest } from "@/lib/genui/compose-context";
import {
  composeRateLimitEnforced,
  readRequestIp,
  requestHost,
} from "@/lib/genui/request";

export const runtime = "nodejs";

const DEADLINE_MS = 15_000;
const capStore = memoryCapStore();

export const POST = async (request: Request) => {
  const body = (await request.json().catch(() => null)) as {
    clientRequestId?: string;
    query?: string;
    version?: number;
  } | null;
  const query = body?.query?.trim() ?? "";
  if (!query) {
    return NextResponse.json(
      { message: "Query is required." },
      { status: 400 }
    );
  }

  const ip = readRequestIp(request);
  const host = requestHost(request);
  const correlationId = body?.clientRequestId?.trim() || crypto.randomUUID();
  const context = composeContextFromRequest({ correlationId, ip });

  const admitted = await admitCompose({
    enforce: composeRateLimitEnforced({ host }),
    ip,
    now: context.clock,
    store: capStore,
  });
  if (!admitted.ok) {
    return NextResponse.json({ message: admitted.message }, { status: 429 });
  }

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
            query,
            version: body?.version ?? 1,
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
