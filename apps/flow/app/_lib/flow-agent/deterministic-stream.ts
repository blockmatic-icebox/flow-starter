import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

import {
  pickFlowAgentTool,
  runFlowAgentTool,
  wantsFocusGenui,
  wantsToggleTheme,
} from "./tools";

interface DeterministicMessage {
  role: string;
  parts: {
    state?: string;
    text?: string;
    type: string;
  }[];
}

const clientToolPartType = (type: string) =>
  type === "tool-focus_genui" || type === "tool-toggle_theme";

const hasCompletedClientToolAck = (messages: DeterministicMessage[]) => {
  const last = messages.at(-1);
  if (!last || last.role !== "assistant") return false;
  return last.parts.some(
    (part) => part.state === "output-available" && clientToolPartType(part.type)
  );
};

const writeTextReply = ({
  text,
  writer,
}: {
  text: string;
  writer: { write: (chunk: Record<string, unknown>) => void };
}) => {
  const textId = crypto.randomUUID();
  writer.write({ id: textId, type: "text-start" });
  writer.write({ delta: text, id: textId, type: "text-delta" });
  writer.write({ id: textId, type: "text-end" });
};

const lastUserText = (messages: DeterministicMessage[]) => {
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
  messages: DeterministicMessage[]
) => {
  const query = lastUserText(messages);
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const messageId = crypto.randomUUID();
      writer.write({ messageId, messageMetadata: undefined, type: "start" });

      if (hasCompletedClientToolAck(messages)) {
        writeTextReply({
          text: "Done.",
          writer,
        });
        writer.write({ finishReason: "stop", type: "finish" });
        return;
      }

      const clientToolName = (() => {
        if (wantsFocusGenui(query)) return "focus_genui";
        if (wantsToggleTheme(query)) return "toggle_theme";
        return null;
      })();

      if (clientToolName) {
        const toolCallId = crypto.randomUUID();
        writer.write({
          input: {},
          providerExecuted: false,
          providerMetadata: undefined,
          toolCallId,
          toolName: clientToolName,
          type: "tool-input-available",
        });
      } else {
        const toolName = pickFlowAgentTool(query);
        const toolCallId = crypto.randomUUID();
        const input =
          toolName === "search_knowledge"
            ? { query }
            : ({} as Record<string, unknown>);
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
