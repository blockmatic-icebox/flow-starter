import type { EvalEvent } from "./types.ts";

const turnOf = (event: EvalEvent) => event.turn ?? 0;

export const mergeSubjectAndRunnerTranscripts = ({
  runnerEvents,
  subjectEvents,
}: {
  runnerEvents: EvalEvent[];
  subjectEvents: EvalEvent[];
}) => {
  const turns = new Set<number>();
  for (const e of subjectEvents) turns.add(turnOf(e));
  for (const e of runnerEvents) turns.add(turnOf(e));
  const orderedTurns = [...turns].toSorted((a, b) => a - b);

  const merged: EvalEvent[] = [];
  for (const turn of orderedTurns) {
    const subjectTurn = subjectEvents.filter((e) => turnOf(e) === turn);
    const runnerTurn = runnerEvents.filter((e) => turnOf(e) === turn);
    const users = subjectTurn.filter((e) => e.kind === "user");
    const assistants = subjectTurn.filter((e) => e.kind === "assistant");
    const runnerRest = runnerTurn.filter(
      (e) => e.kind !== "user" && e.kind !== "assistant"
    );
    merged.push(...users, ...assistants, ...runnerRest);
  }

  return merged;
};
