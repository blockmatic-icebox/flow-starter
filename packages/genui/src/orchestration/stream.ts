import type { CompositionEnvelope } from "../core/envelope";

export type ComposeStreamEvent =
  | { requestId: string; sequence: number; type: "start" }
  | {
      envelope: CompositionEnvelope;
      requestId: string;
      sequence: number;
      type: "partial" | "complete";
    }
  | { message: string; requestId: string; sequence: number; type: "error" };

export type NdjsonParseResult =
  | { ok: true; events: Record<string, unknown>[] }
  | { ok: false; error: "malformed_line" | "empty_stream"; line?: string };

const parseNdjsonLine = (
  line: string
): { ok: true; event: Record<string, unknown> } | { ok: false } => {
  try {
    return { event: JSON.parse(line) as Record<string, unknown>, ok: true };
  } catch {
    return { ok: false };
  }
};

export const parseNdjsonText = (text: string): NdjsonParseResult => {
  const events: Record<string, unknown>[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const parsed = parseNdjsonLine(line);
    if (!parsed.ok) return { error: "malformed_line", line, ok: false };
    events.push(parsed.event);
  }
  if (!events.length) return { error: "empty_stream", ok: false };
  return { events, ok: true };
};

export const consumeNdjsonResponse = async ({
  onEvent,
  response,
}: {
  onEvent: (event: Record<string, unknown>) => void;
  response: Response;
}) => {
  const reader = response.body?.getReader();
  if (!reader) return { ok: false as const, reason: "no_body" as const };
  const decoder = new TextDecoder();
  let buffer = "";
  const pump = async (): Promise<{
    ok: false;
    reason: "malformed_line";
  } | null> => {
    const { done, value } = await reader.read();
    if (done) return null;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const parsed = parseNdjsonLine(line);
      if (!parsed.ok) {
        return { ok: false as const, reason: "malformed_line" as const };
      }
      onEvent(parsed.event);
    }
    return pump();
  };
  const streamError = await pump();
  if (streamError) return streamError;
  const trailing = buffer.trim();
  if (trailing) {
    const parsed = parseNdjsonLine(trailing);
    if (!parsed.ok) {
      return { ok: false as const, reason: "malformed_line" as const };
    }
    onEvent(parsed.event);
  }
  return { ok: true as const };
};
