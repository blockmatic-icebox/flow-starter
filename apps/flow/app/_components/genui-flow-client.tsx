"use client";

import type { CompositionEnvelope } from "@repo/genui";
import { consumeNdjsonResponse } from "@repo/genui";
import { GenuiRenderer } from "@repo/genui/react";
import { parseAsString, useQueryState } from "nuqs";
import { useRef, useState } from "react";

const defaultQuery =
  "Show the Flow workflow: Explore, Specify, Plan, Build, Review, Ship";

export const GenuiFlowClient = () => {
  const [query, setQuery] = useQueryState(
    "q",
    parseAsString.withDefault(defaultQuery).withOptions({ history: "replace" })
  );
  const [envelope, setEnvelope] = useState<CompositionEnvelope | null>(null);
  const [status, setStatus] = useState("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef("");

  const submit = async () => {
    if (!query.trim()) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = crypto.randomUUID();
    requestIdRef.current = requestId;
    setStatus("loading");
    setEnvelope(null);
    setNotice(null);

    try {
      const response = await fetch("/api/genui/compose", {
        body: JSON.stringify({
          clientRequestId: requestId,
          query,
          version: 1,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: controller.signal,
      });
      if (requestIdRef.current !== requestId) return;
      if (!response.ok) {
        setStatus("error");
        setNotice("The composition request failed.");
        return;
      }

      let sawComplete = false;
      let sawError = false;
      const consumed = await consumeNdjsonResponse({
        onEvent: (event) => {
          if (requestIdRef.current !== requestId) return;
          if (event.requestId !== requestId) return;
          if (event.type === "partial") {
            setEnvelope(event.envelope);
            setStatus("streaming");
          }
          if (event.type === "complete") {
            setEnvelope(event.envelope);
            sawComplete = true;
          }
          if (event.type === "error") {
            sawError = true;
            setNotice(event.message);
          }
        },
        response,
      });
      if (requestIdRef.current !== requestId) return;
      if (!consumed.ok || sawError || !sawComplete) {
        setStatus("error");
        if (!consumed.ok) setNotice("The composition stream was invalid.");
        return;
      }
      setStatus("complete");
    } catch {
      if (requestIdRef.current !== requestId || controller.signal.aborted)
        return;
      setStatus("error");
      setNotice("The composition request failed.");
    }
  };

  return (
    <div id="flow-genui" className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Flow</h1>
        <p className="text-muted-foreground text-sm">
          Ask about Flow methodology and Flow Starter — answers render as
          validated Generative UI compositions.
        </p>
      </header>
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <input
          aria-label="Ask about Flow"
          className="border-border flex-1 rounded-md border px-3 py-2 text-sm"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ask about Flow…"
          value={query}
        />
        <button
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
          type="submit"
        >
          Compose
        </button>
      </form>
      <p className="text-muted-foreground text-xs">Status: {status}</p>
      {notice ? <p className="text-destructive text-xs">{notice}</p> : null}
      {envelope ? (
        <div className="border-border rounded-lg border p-4">
          <GenuiRenderer complete={status === "complete"} envelope={envelope} />
        </div>
      ) : null}
    </div>
  );
};
