import { existsSync, readFileSync } from "node:fs";

import type { EvalEvent } from "./types.ts";

export const loadTranscript = ({ eventsPath }: { eventsPath: string }) =>
  existsSync(eventsPath)
    ? readFileSync(eventsPath, "utf-8")
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as EvalEvent)
    : [];
