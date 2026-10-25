import { createHash } from "node:crypto";

import type { EvalEvent, Origin } from "./types.ts";

const allowedSubjectOrigins = new Set<Origin>(["agent-reported"]);

export const submissionFingerprint = ({
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
}) =>
  createHash("sha256")
    .update(
      JSON.stringify({
        events,
        repetition,
        runId,
        scenarioId,
        turn,
      })
    )
    .digest("hex")
    .slice(0, 16);

export const validateSubjectRecordEvents = ({
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
  const seenIds = new Set<string>();
  const seenSeq = new Map<number, string>();

  for (const event of events) {
    if (!event.origin)
      return { ok: false as const, reason: "missing event origin" };
    if (event.origin === "observed")
      return {
        ok: false as const,
        reason: "subject record channel cannot submit observed events",
      };
    if (event.origin === "evaluator-inference")
      return {
        ok: false as const,
        reason: "subject record cannot claim evaluator-inference origin",
      };
    if (!allowedSubjectOrigins.has(event.origin))
      return {
        ok: false as const,
        reason: `disallowed origin ${event.origin}`,
      };
    if (event.kind === "command")
      return {
        ok: false as const,
        reason: "subject record cannot submit command events as evidence",
      };
    if (event.kind !== "assistant")
      return {
        ok: false as const,
        reason: "subject record accepts assistant claims only",
      };
    if (event.scenarioId && event.scenarioId !== scenarioId)
      return { ok: false as const, reason: "scenarioId mismatch" };
    if (event.turn !== undefined && event.turn !== turn)
      return { ok: false as const, reason: "turn mismatch" };
    if (seenIds.has(event.id))
      return { ok: false as const, reason: "duplicate event id" };
    seenIds.add(event.id);
    if (event.seq !== undefined) {
      const prior = seenSeq.get(event.seq);
      if (prior && prior !== event.id)
        return { ok: false as const, reason: "conflicting event sequence" };
      seenSeq.set(event.seq, event.id);
    }
  }

  const normalized = events.map((event) => ({
    ...event,
    origin: "agent-reported" as const,
    scenarioId,
    turn,
  }));

  const fingerprint = submissionFingerprint({
    events: normalized,
    repetition,
    runId,
    scenarioId,
    turn,
  });

  return { events: normalized, fingerprint, ok: true as const };
};
