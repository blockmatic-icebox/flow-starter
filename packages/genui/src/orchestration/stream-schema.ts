import { z } from "zod";

import { validateCompositionEnvelope } from "../contract/compiler";
import { GENUI_LIBRARY_VERSION } from "../core/envelope";
import { GENUI_MAX_DOCUMENT_BYTES } from "../core/limits";
import type { ComposeStreamEvent } from "./stream";

export const NDJSON_MAX_LINE_BYTES = 128 * 1024;
export const NDJSON_MAX_RESPONSE_BYTES = 512 * 1024;
export const NDJSON_MAX_EVENTS = 32;

const requestId = z.string().min(1).max(128);
const sequence = z.number().int().nonnegative();

const recordId = z.string().min(1).max(200);

const entityRecord = z.strictObject({
  id: recordId,
  kind: z.literal("entity"),
  summary: z.string().max(2000).optional(),
  tags: z.array(z.string().max(80)).max(32).optional(),
  title: z.string().min(1).max(500),
  url: z.string().min(1).max(2000),
});

const documentRecord = z.strictObject({
  excerpt: z.string().min(1).max(4000),
  id: recordId,
  kind: z.literal("document"),
  revisedAt: z.string().max(40).optional(),
  title: z.string().min(1).max(500),
  url: z.string().min(1).max(2000),
});

const metricRecord = z.strictObject({
  id: recordId,
  kind: z.literal("metric"),
  label: z.string().min(1).max(500),
  trend: z.enum(["up", "down", "flat"]).optional(),
  unit: z.string().max(40).optional(),
  value: z.string().min(1).max(200),
});

const mediaRecord = z.strictObject({
  id: recordId,
  kind: z.literal("media"),
  mimeType: z.string().min(1).max(200),
  title: z.string().min(1).max(500),
  url: z.string().min(1).max(2000),
});

const envelopeSchema = z.strictObject({
  fallbackText: z.string().max(8000),
  libraryVersion: z.literal(GENUI_LIBRARY_VERSION),
  openuiText: z.string().min(1).max(GENUI_MAX_DOCUMENT_BYTES),
  records: z
    .array(
      z.discriminatedUnion("kind", [
        entityRecord,
        documentRecord,
        metricRecord,
        mediaRecord,
      ])
    )
    .max(64),
  requestId,
});

const composeStreamEventSchema = z.discriminatedUnion("type", [
  z.strictObject({ requestId, sequence, type: z.literal("start") }),
  z.strictObject({
    envelope: envelopeSchema,
    requestId,
    sequence,
    type: z.literal("partial"),
  }),
  z.strictObject({
    envelope: envelopeSchema,
    requestId,
    sequence,
    type: z.literal("complete"),
  }),
  z.strictObject({
    message: z.string().min(1).max(500),
    requestId,
    sequence,
    type: z.literal("error"),
  }),
]);

export const parseComposeStreamEvent = (
  value: unknown
):
  | { event: ComposeStreamEvent; ok: true }
  | { ok: false; reason: "invalid_event" } => {
  const parsed = composeStreamEventSchema.safeParse(value);
  if (!parsed.success) return { ok: false, reason: "invalid_event" };
  if (parsed.data.type === "partial" || parsed.data.type === "complete") {
    const validated = validateCompositionEnvelope({
      envelope: parsed.data.envelope,
    });
    if (!validated.ok) return { ok: false, reason: "invalid_event" };
  }
  return { event: parsed.data, ok: true };
};
