import { composeQuery } from "@repo/genui";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEADLINE_MS = 15_000;

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

  const clientRequestId = body?.clientRequestId?.trim() || crypto.randomUUID();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const abortController = new AbortController();
      const onAbort = () => abortController.abort();
      request.signal.addEventListener("abort", onAbort);
      const deadline = setTimeout(() => abortController.abort(), DEADLINE_MS);
      try {
        composeQuery({
          input: {
            clientRequestId,
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
              requestId: clientRequestId,
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
