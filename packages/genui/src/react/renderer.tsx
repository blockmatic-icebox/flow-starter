"use client";

import { Renderer } from "@openuidev/react-lang";

import type { CompositionEnvelope } from "../core/envelope";
import { flowGenuiReactLibrary } from "./library";
import { GenuiRecordContext } from "./record-context";

export const GenuiRenderer = ({
  complete = true,
  envelope,
  isStreaming = false,
}: {
  complete?: boolean;
  envelope: CompositionEnvelope;
  isStreaming?: boolean;
}) => (
  <GenuiRecordContext.Provider value={envelope.records}>
    <Renderer
      isStreaming={isStreaming || !complete}
      library={flowGenuiReactLibrary}
      onError={(errors) => {
        if (errors.length > 0) console.warn("OpenUI parse errors", errors);
      }}
      response={envelope.openuiText}
    />
  </GenuiRecordContext.Provider>
);
