"use client";

import { useChat } from "@ai-sdk/react";
import { Button } from "@repo/ui/components/button";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Textarea } from "@repo/ui/components/textarea";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { useTheme } from "next-themes";
import { useCallback, useState } from "react";

import { FlowAgentMessageParts } from "@/app/_components/flow-agent-message-parts";
import { FlowAgentSpeechInputButton } from "@/app/_components/flow-agent-speech-input-button";

export const FlowAgentPanel = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, addToolOutput } = useChat({
    onToolCall: ({ toolCall }) => {
      if (toolCall.dynamic) return;

      if (toolCall.toolName === "focus_genui") {
        document.querySelector("#flow-genui")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        addToolOutput({
          output: { ok: true },
          tool: "focus_genui",
          toolCallId: toolCall.toolCallId,
        });
      }

      if (toolCall.toolName === "toggle_theme") {
        const next = resolvedTheme === "dark" ? "light" : "dark";
        setTheme(next);
        addToolOutput({
          output: { ok: true, theme: next },
          tool: "toggle_theme",
          toolCallId: toolCall.toolCallId,
        });
      }
    },
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const onSubmit = useCallback(
    (event?: React.FormEvent) => {
      event?.preventDefault();
      const text = input.trim();
      if (!text || status === "streaming" || status === "submitted") return;
      sendMessage({ text });
      setInput("");
    },
    [input, sendMessage, status]
  );

  const onSpeech = useCallback((transcript: string) => {
    setInput((current) => (current ? `${current} ${transcript}` : transcript));
  }, []);

  const isBusy = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-medium">Flow Agent</h2>
        <p className="text-muted-foreground text-xs">
          Flow methodology and Flow Factory architecture. Voice uses your
          browser microphone.
        </p>
      </header>
      <ScrollArea className="min-h-0 flex-1 px-3 py-3">
        <div
          className="flex flex-col gap-4"
          aria-live="polite"
          aria-busy={isBusy}
        >
          {messages.length === 0 && (
            <p className="text-muted-foreground text-xs">
              Try: “How does Flow work?” or “Show the architecture of Flow
              Starter.”
            </p>
          )}
          {messages.map((message) => (
            <FlowAgentMessageParts key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>
      <form className="flex flex-col gap-2 border-t p-3" onSubmit={onSubmit}>
        <Textarea
          value={input}
          rows={3}
          placeholder="Message Flow Agent…"
          disabled={isBusy}
          onChange={(event) => setInput(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
        />
        <div className="flex items-center justify-between gap-2">
          <FlowAgentSpeechInputButton
            disabled={isBusy}
            onTranscript={onSpeech}
          />
          <Button type="submit" disabled={isBusy || !input.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
};
