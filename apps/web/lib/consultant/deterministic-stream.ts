import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

import {
  pickConsultantTool,
  runConsultantTool,
  wantsOpenGenuiDemo,
  wantsToggleTheme,
} from "./tools";

const lastUserText = (
  messages: { role: string; parts: { type: string; text?: string }[] }[]
) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages.at(index);
    if (!message || message.role !== "user") continue;
    const text = message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text ?? "")
      .join("");
    if (text.trim()) return text.trim();
  }
  return "";
};

export const deterministicConsultantResponse = (
  messages: { role: string; parts: { type: string; text?: string }[] }[]
) => {
  const query = lastUserText(messages);
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const messageId = crypto.randomUUID();
      writer.write({ messageId, messageMetadata: undefined, type: "start" });

      if (wantsOpenGenuiDemo(query)) {
        const toolCallId = crypto.randomUUID();
        writer.write({
          input: {},
          providerExecuted: false,
          providerMetadata: undefined,
          toolCallId,
          toolName: "open_genui_demo",
          type: "tool-input-available",
        });
      } else if (wantsToggleTheme(query)) {
        const toolCallId = crypto.randomUUID();
        writer.write({
          input: {},
          providerExecuted: false,
          providerMetadata: undefined,
          toolCallId,
          toolName: "toggle_theme",
          type: "tool-input-available",
        });
      } else {
        const toolName = pickConsultantTool(query) ?? "describe_architecture";
        const toolCallId = crypto.randomUUID();
        const output = runConsultantTool(toolName);
        writer.write({
          input: {},
          providerExecuted: true,
          providerMetadata: undefined,
          toolCallId,
          toolName,
          type: "tool-input-available",
        });
        writer.write({
          output: { text: output },
          toolCallId,
          type: "tool-output-available",
        });
        const textId = crypto.randomUUID();
        writer.write({ id: textId, type: "text-start" });
        writer.write({
          delta: output,
          id: textId,
          type: "text-delta",
        });
        writer.write({ id: textId, type: "text-end" });
      }

      writer.write({ finishReason: "stop", type: "finish" });
    },
  });

  return createUIMessageStreamResponse({ stream });
};
