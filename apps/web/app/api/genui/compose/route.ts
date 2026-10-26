import { getDb, loadRootEnv } from "@repo/fi";
import { MAX_QUERY_CODE_POINTS } from "@repo/genui";
import type { ComposeInput } from "@repo/genui";
import { z } from "zod";

import { composeFiQuery } from "@/app/_lib/genui/compose-fi";

loadRootEnv();

const bodySchema = z.object({
  clientRequestId: z.string().min(1),
  query: z.string().min(1).max(MAX_QUERY_CODE_POINTS),
  version: z.number().int().positive(),
});

export const POST = async (request: Request) => {
  let input: ComposeInput;
  try {
    const json = await request.json();
    input = bodySchema.parse(json);
  } catch {
    return Response.json({ error: "invalid-body" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      void composeFiQuery({
        db: getDb(),
        input,
        onEvent: (event) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        },
      })
        .then(() => controller.close())
        .catch(() => {
          controller.enqueue(
            encoder.encode(
              `${JSON.stringify({
                message: "Compose failed.",
                requestId: input.clientRequestId,
                sequence: 0,
                type: "error",
              })}\n`
            )
          );
          controller.close();
        });
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/x-ndjson",
    },
  });
};
