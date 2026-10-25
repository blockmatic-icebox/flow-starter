import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

import { devEvalsRoot } from "./paths.ts";
import { trialScenarioDir } from "./trial-paths.ts";

export const resolveScenarioEvidenceDir = ({
  repetition = 1,
  runId,
  scenarioId,
}: {
  repetition?: number;
  runId: string;
  scenarioId: string;
}) => {
  const trialDir = trialScenarioDir({ repetition, runId, scenarioId });
  if (existsSync(path.join(trialDir, "transcript.jsonl"))) return trialDir;

  const trialsRoot = path.join(devEvalsRoot, runId, "trials", scenarioId);
  if (existsSync(trialsRoot)) {
    const reps = readdirSync(trialsRoot)
      .filter((name) => /^r\d+$/u.test(name))
      .toSorted()
      .toReversed();
    for (const rep of reps) {
      const candidate = path.join(trialsRoot, rep);
      if (existsSync(path.join(candidate, "transcript.jsonl")))
        return candidate;
    }
  }

  const legacy = path.join(devEvalsRoot, runId, "scenarios", scenarioId);
  return legacy;
};
