import type { EvalEvent, Origin } from "./types.ts";

const allowedSubjectOrigins = new Set<Origin>([
  "agent-reported",
  "evaluator-inference",
  "missing",
]);

export const validateSubjectRecordEvents = ({
  events,
  scenarioId,
  turn,
}: {
  events: EvalEvent[];
  repetition: number;
  runId: string;
  scenarioId: string;
  turn: number;
}) => {
  for (const event of events) {
    if (!event.origin)
      return { ok: false as const, reason: "missing event origin" };
    if (event.origin === "observed")
      return {
        ok: false as const,
        reason: "subject record channel cannot submit observed events",
      };
    if (!allowedSubjectOrigins.has(event.origin))
      return {
        ok: false as const,
        reason: `disallowed origin ${event.origin}`,
      };
    if (event.scenarioId && event.scenarioId !== scenarioId)
      return { ok: false as const, reason: "scenarioId mismatch" };
    if (event.turn !== undefined && event.turn !== turn)
      return { ok: false as const, reason: "turn mismatch" };
    if (event.kind === "command")
      return {
        ok: false as const,
        reason: "subject record cannot submit command events as evidence",
      };
  }

  const normalized = events.map((event) => ({
    ...event,
    origin:
      event.kind === "assistant" ? ("agent-reported" as const) : event.origin,
    scenarioId,
    turn,
  }));

  return { events: normalized, ok: true as const };
};
