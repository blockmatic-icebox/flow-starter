import path from "node:path";

import { runEvalDir } from "./paths.ts";

export const trialScenarioDir = ({
  repetition,
  runId,
  scenarioId,
}: {
  repetition: number;
  runId: string;
  scenarioId: string;
}) => path.join(runEvalDir(runId), "trials", scenarioId, `r${repetition}`);
