"use client";

import type { CompositionEnvelope } from "@repo/genui";
import { consumeNdjsonResponse } from "@repo/genui";
import { GenuiRenderer } from "@repo/genui/react";
import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

const starters = [
  "What reporting work should we prioritize?",
  "Are these requests duplicates?",
  "Why do customers disagree about public links?",
  "What changed in customer feedback this month?",
  "What happened to last week's reviewed feedback?",
  "Summarize integration feedback when analysis fails",
];

export const AskHunchClient = () => {
  const [input, setInput] = useState("");
  const [prompt, setPrompt] = useState<string | null>(null);
  const [envelope, setEnvelope] = useState<CompositionEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const generationRef = useRef(0);
  const latestRequestIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const submit = useCallback(async (text: string) => {
    const query = text.trim();
    if (!query) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    generationRef.current += 1;
    const clientRequestId = `ask-${generationRef.current}`;
    latestRequestIdRef.current = clientRequestId;
    setPrompt(query);
    setEnvelope(null);
    setError(null);
    setLoading(true);

    let latest: CompositionEnvelope | null = null;
    let streamMessage: string | null = null;

    try {
      const response = await fetch("/api/genui/compose", {
        body: JSON.stringify({
          clientRequestId,
          query,
          version: 1,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: controller.signal,
      });

      const result = await consumeNdjsonResponse({
        onEvent: (event) => {
          if (event.requestId !== clientRequestId) return;
          if (event.type === "error") streamMessage = event.message;
          if (event.type === "partial" || event.type === "complete")
            latest = event.envelope;
        },
        response,
      });

      if (latestRequestIdRef.current !== clientRequestId) return;

      if (!result.ok) setError(`Stream error: ${result.reason}`);
      else if (streamMessage) setError(streamMessage);
      else if (latest) setEnvelope(latest);
      else setError("No composition returned.");
      setLoading(false);
    } catch (error_) {
      if (latestRequestIdRef.current !== clientRequestId) return;
      if ((error_ as Error).name !== "AbortError")
        setError("Could not reach compose service.");
      setLoading(false);
    }
  }, []);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Ask Hunch</h1>
        <p className="text-muted-foreground text-sm">
          Task-specific views from your feedback data. Generating a view does
          not record decisions — use{" "}
          <Link className="text-primary underline" href="/review">
            Triage
          </Link>{" "}
          to record decisions.
        </p>
      </header>

      {prompt ? (
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium">You asked:</span>{" "}
          {prompt}
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {starters.map((text) => (
            <li key={text}>
              <Button
                onClick={() => submit(text)}
                size="sm"
                type="button"
                variant="outline"
              >
                {text}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div aria-busy={loading} className="min-h-[12rem] space-y-3">
        {loading ? (
          <output className="text-muted-foreground text-sm">
            Composing view…
          </output>
        ) : null}
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
        {envelope ? <GenuiRenderer complete envelope={envelope} /> : null}
      </div>

      <form
        className="border-border bg-card sticky bottom-0 flex flex-col gap-2 border-t pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(input);
          setInput("");
        }}
      >
        <Textarea
          aria-label="Ask about feedback, themes, or decisions"
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about feedback, themes, or decisions…"
          rows={2}
          value={input}
        />
        <Button disabled={loading} type="submit">
          {loading ? "Generating…" : "Generate view"}
        </Button>
      </form>
    </div>
  );
};
