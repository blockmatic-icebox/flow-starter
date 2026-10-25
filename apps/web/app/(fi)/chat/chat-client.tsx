"use client";

import { useChat } from "@ai-sdk/react";
import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { useState } from "react";

const starters = [
  "What is Feature Intelligence?",
  "How does the PM triage queue work?",
  "What metrics appear on Insights?",
  "How do duplicates get detected on submit?",
];

const messageText = (message: { parts?: { type: string; text?: string }[] }) =>
  message.parts
    ?.filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("") ?? "";

export const ChatClient = () => {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();
  const isLoading = status === "streaming" || status === "submitted";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {messages.length === 0 ? (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Ask-only help — no request mutations from this chat.
          </p>
          <ul className="flex flex-wrap gap-2">
            {starters.map((text) => (
              <li key={text}>
                <Button
                  onClick={() => {
                    sendMessage({ text }).catch(console.error);
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {text}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <ul className="space-y-3">
        {messages.map((m) => (
          <li className="text-sm" key={m.id}>
            <span className="font-medium">
              {m.role === "user" ? "You" : "FI"}:
            </span>{" "}
            {messageText(m)}
          </li>
        ))}
      </ul>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const text = input.trim();
          if (!text) return;
          sendMessage({ text }).catch(console.error);
          setInput("");
        }}
      >
        <Textarea
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about workflows or metrics…"
          rows={3}
          value={input}
        />
        <Button disabled={isLoading} type="submit">
          {isLoading ? "Sending…" : "Send"}
        </Button>
      </form>
    </div>
  );
};
