import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type {
  DelegationPolicy,
  DelegationResult,
  DelegationSignals,
} from "./delegation.ts";

const scenariosDir = path.join(
  fileURLToPath(new URL("..", import.meta.url)),
  "scenarios",
  "delegation"
);

export interface DelegationScenarioExpected extends Pick<
  DelegationResult,
  | "executionMode"
  | "workerCount"
  | "writable"
  | "humanGate"
  | "allowBuild"
  | "fallback"
  | "maxConcurrent"
> {
  skillsIncludes?: string[];
  humanGateReason?: string;
}

export interface DelegationScenarioCard {
  id: string;
  title: string;
  relatedLiveCard?: string;
  signals: DelegationSignals;
  expected: Record<DelegationPolicy, DelegationScenarioExpected>;
}

export const listDelegationScenarioIds = () =>
  readdirSync(scenariosDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.replace(/\.json$/u, ""))
    .toSorted((a, b) => a.localeCompare(b));

export const loadDelegationScenario = ({
  id,
}: {
  id: string;
}): DelegationScenarioCard => {
  const filePath = path.join(scenariosDir, `${id}.json`);
  return JSON.parse(readFileSync(filePath, "utf-8")) as DelegationScenarioCard;
};
