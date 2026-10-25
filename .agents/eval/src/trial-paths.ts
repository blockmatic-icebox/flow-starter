import path from "node:path";

import { devEvalsRoot } from "./paths.ts";

export const trialScenarioDir = ({
  repetition,
  runId,
  scenarioId,
}: {
  repetition: number;
  runId: string;
  scenarioId: string;
}) => path.join(devEvalsRoot, runId, "trials", scenarioId, `r${repetition}`);
