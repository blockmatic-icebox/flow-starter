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
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { ConsultantMessageParts } from "./message-parts";
import { SpeechInputButton } from "./speech-input-button";

export const ConsultantChatPanel = () => {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, addToolOutput } = useChat({
    onToolCall: ({ toolCall }) => {
      if (toolCall.dynamic) return;

      if (toolCall.toolName === "open_genui_demo") {
        router.push("/genui-demo");
        addToolOutput({
          output: { ok: true, path: "/genui-demo" },
          tool: "open_genui_demo",
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
        <h2 className="text-sm font-medium">Consultant</h2>
        <p className="text-muted-foreground text-xs">
          Ask how Flow Starter is built. Voice uses your browser microphone.
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
              Try: “How is this app built?” or “Open the GenUI demo.”
            </p>
          )}
          {messages.map((message) => (
            <ConsultantMessageParts key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>
      <form className="flex flex-col gap-2 border-t p-3" onSubmit={onSubmit}>
        <Textarea
          value={input}
          rows={3}
          placeholder="Message the consultant…"
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
          <SpeechInputButton disabled={isBusy} onTranscript={onSpeech} />
          <Button type="submit" disabled={isBusy || !input.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
};
