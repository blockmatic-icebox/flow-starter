"use client";

import type { CompositionEnvelope } from "@repo/genui";
import { consumeNdjsonResponse } from "@repo/genui";
import { GenuiRenderer } from "@repo/genui/react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";

export const GenuiDemoClient = () => {
  const [query, setQuery] = useQueryState(
    "q",
    parseAsString
      .withDefault("Compare Orbit plan versus Nova plan")
      .withOptions({ history: "replace" })
  );
  const [envelope, setEnvelope] = useState<CompositionEnvelope | null>(null);
  const [status, setStatus] = useState<string>("idle");

  const submit = async () => {
    if (!query.trim()) return;
    setStatus("loading");
    setEnvelope(null);
    const response = await fetch("/api/genui/compose", {
      body: JSON.stringify({
        clientRequestId: crypto.randomUUID(),
        query,
        version: 1,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    let latest: CompositionEnvelope | null = null;
    await consumeNdjsonResponse({
      onEvent: (event) => {
        if (event.type === "partial" || event.type === "complete") {
          latest = event.envelope as CompositionEnvelope;
          setEnvelope(latest);
        }
        if (event.type === "error") setStatus("error");
      },
      response,
    });
    setStatus(latest ? "complete" : "error");
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Acme Analytics GenUI demo</h1>
        <p className="text-muted-foreground text-sm">
          Fictional catalog only — illustrates Flow&apos;s portable OpenUI Lang
          pipeline.
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
          className="border-border flex-1 rounded-md border px-3 py-2 text-sm"
          onChange={(event) => setQuery(event.target.value)}
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
      {envelope ? (
        <div className="border-border rounded-lg border p-4">
          <GenuiRenderer complete={status === "complete"} envelope={envelope} />
        </div>
      ) : null}
    </div>
  );
};
