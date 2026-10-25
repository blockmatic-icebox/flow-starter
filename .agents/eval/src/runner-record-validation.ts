import { createHash } from "node:crypto";

import { duplicateEventIdReason } from "./event-id-validation.ts";
import { TRUSTED_CAPTURE_METHOD } from "./isolation-trial.ts";
import type { EvalEvent, Origin } from "./types.ts";

const allowedRunnerOrigins = new Set<Origin>(["observed"]);

const allowedRunnerKinds = new Set([
  "assistant",
  "command",
  "metadata",
  "tool",
]);

export const validateRunnerObserveEvents = ({
  events,
  repetition,
  runId,
  scenarioId,
  turn,
}: {
  events: EvalEvent[];
  repetition: number;
  runId: string;
  scenarioId: string;
  turn: number;
}) => {
  if (!runId) return { ok: false as const, reason: "missing runId" };
  const duplicateId = duplicateEventIdReason({ events });
  if (duplicateId) return { ok: false as const, reason: duplicateId };

  for (const event of events) {
    if (!event.origin)
      return { ok: false as const, reason: "missing event origin" };
    if (!allowedRunnerOrigins.has(event.origin))
      return {
        ok: false as const,
        reason: `runner observe allows observed only, got ${event.origin}`,
      };
    if (event.captureMethod !== TRUSTED_CAPTURE_METHOD)
      return {
        ok: false as const,
        reason: "runner observe requires captureMethod runner-subprocess",
      };
    if (!allowedRunnerKinds.has(event.kind))
      return {
        ok: false as const,
        reason: `disallowed runner event kind ${event.kind}`,
      };
    if (event.kind === "assistant" && event.origin !== "observed")
      return {
        ok: false as const,
        reason: "runner assistant must be observed",
      };
    if (event.scenarioId && event.scenarioId !== scenarioId)
      return { ok: false as const, reason: "scenarioId mismatch" };
    if (event.turn !== undefined && event.turn !== turn)
      return { ok: false as const, reason: "turn mismatch" };
  }

  const normalized = events.map((event) => ({
    ...event,
    origin: "observed" as const,
    scenarioId,
    turn,
  }));

  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        events: normalized,
        repetition,
        runId,
        scenarioId,
        turn,
      })
    )
    .digest("hex")
    .slice(0, 16);

  return { events: normalized, fingerprint, ok: true as const };
};
