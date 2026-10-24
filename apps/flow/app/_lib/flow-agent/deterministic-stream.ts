import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

import {
  pickFlowAgentTool,
  runFlowAgentTool,
  wantsFocusGenui,
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

export const deterministicFlowAgentResponse = (
  messages: { role: string; parts: { type: string; text?: string }[] }[]
) => {
  const query = lastUserText(messages);
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const messageId = crypto.randomUUID();
      writer.write({ messageId, messageMetadata: undefined, type: "start" });

      if (wantsFocusGenui(query)) {
        const toolCallId = crypto.randomUUID();
        writer.write({
          input: {},
          providerExecuted: false,
          providerMetadata: undefined,
          toolCallId,
          toolName: "focus_genui",
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
        const toolName = pickFlowAgentTool(query) ?? "describe_architecture";
        const toolCallId = crypto.randomUUID();
        let input: Record<string, unknown> = {};
        if (toolName === "search_knowledge") input = { query };
        if (toolName === "read_knowledge_document") {
          input = { path: "docs/workflow/flow.md" };
        }
        const output = runFlowAgentTool(toolName, input);
        writer.write({
          input,
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

/** @deprecated use deterministicFlowAgentResponse */
export const deterministicConsultantResponse = deterministicFlowAgentResponse;
