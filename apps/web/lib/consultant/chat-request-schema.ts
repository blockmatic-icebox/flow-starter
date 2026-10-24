import { safeValidateUIMessages } from "ai";
import type { ToolSet, UIMessage } from "ai";
import { z } from "zod";

const MAX_MESSAGES = 30;
const MAX_PARTS = 40;
const MAX_TEXT_CODE_POINTS = 8000;
const MAX_ID_LENGTH = 128;

const consultantToolNames = new Set([
  "describe_architecture",
  "describe_capabilities",
  "describe_technologies",
  "open_genui_demo",
  "toggle_theme",
]);

const codePointLength = (value: string) => [...value].length;

const chatEnvelopeSchema = z.strictObject({
  id: z.string().min(1).max(MAX_ID_LENGTH).optional(),
  messageId: z.string().min(1).max(MAX_ID_LENGTH).optional(),
  messages: z.array(z.unknown()).min(1).max(MAX_MESSAGES),
  trigger: z
    .enum(["submit-message", "regenerate-message", "resume-stream"])
    .optional(),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const allowedToolName = (type: string) =>
  type.startsWith("tool-") &&
  consultantToolNames.has(type.slice("tool-".length));

const unsupportedPart = (part: Record<string, unknown>) => {
  const { type } = part;
  if (typeof type !== "string") return true;
  if (type === "text") return typeof part.text !== "string";
  if (type === "reasoning" || type === "reasoning-file") return false;
  if (type === "step-start") return false;
  if (type === "dynamic-tool")
    return (
      typeof part.toolName !== "string" ||
      !consultantToolNames.has(part.toolName)
    );
  if (type.startsWith("tool-")) return !allowedToolName(type);
  return true;
};

const userText = (part: Record<string, unknown>, role: unknown) => {
  const { text } = part;
  if (typeof text !== "string") return null;
  if (codePointLength(text) > MAX_TEXT_CODE_POINTS) return null;
  return role === "user" && text.trim().length > 0;
};

const prepareMessage = (message: unknown) => {
  if (!isRecord(message)) return null;
  if (message.role !== "user" && message.role !== "assistant") return null;
  if (typeof message.id !== "string" || message.id.length > MAX_ID_LENGTH)
    return null;
  if (!Array.isArray(message.parts) || message.parts.length > MAX_PARTS)
    return null;

  const parts: unknown[] = [];
  let hasUserText = false;
  for (const part of message.parts) {
    if (!isRecord(part) || unsupportedPart(part)) return null;
    if (part.type === "reasoning" || part.type === "reasoning-file") continue;
    if (part.type === "text") {
      const included = userText(part, message.role);
      if (included === null) return null;
      if (included) hasUserText = true;
    }
    parts.push(part);
  }

  if (parts.length === 0) return null;
  if (message.role === "user" && !hasUserText) return null;
  return {
    hasUserText,
    message: { id: message.id, parts, role: message.role },
  };
};

const prepareMessages = (messages: unknown[]) => {
  const prepared: unknown[] = [];
  let hasUserText = false;
  for (const message of messages) {
    const next = prepareMessage(message);
    if (!next) return null;
    if (next.hasUserText) hasUserText = true;
    prepared.push(next.message);
  }
  if (!hasUserText) return null;
  return prepared;
};

export const parseChatRequest = async ({
  body,
  tools,
}: {
  body: unknown;
  tools: ToolSet;
}): Promise<
  { messages: UIMessage[]; ok: true } | { message: string; ok: false }
> => {
  const envelope = chatEnvelopeSchema.safeParse(body);
  if (!envelope.success) return { message: "Invalid chat request.", ok: false };

  const prepared = prepareMessages(envelope.data.messages);
  if (!prepared) return { message: "Invalid chat request.", ok: false };

  const validated = await safeValidateUIMessages({
    messages: prepared,
    tools,
  });
  if (!validated.success)
    return { message: "Invalid chat request.", ok: false };

  return { messages: validated.data, ok: true };
};
