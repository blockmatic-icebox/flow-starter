import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { TRUSTED_CAPTURE_METHOD } from "./isolation-trial.ts";
import type { EvalEvent } from "./types.ts";

export const RUNNER_CAPTURE_DIR = "runner-capture";
export const CAPTURE_MANIFEST_FILE = "capture-manifest.json";
export const CAPTURE_EVENTS_FILE = "events.json";

export const runnerCaptureDir = ({ scenarioDir }: { scenarioDir: string }) =>
  path.join(scenarioDir, RUNNER_CAPTURE_DIR);

export const isTrustedRunnerEventsFile = ({
  eventsFile,
  scenarioDir,
}: {
  eventsFile: string;
  scenarioDir: string;
}) => {
  const resolved = path.resolve(eventsFile);
  const captureRoot = path.resolve(runnerCaptureDir({ scenarioDir }));
  if (!resolved.startsWith(`${captureRoot}${path.sep}`)) return false;
  if (!resolved.endsWith(CAPTURE_EVENTS_FILE)) return false;
  const manifestPath = path.join(captureRoot, CAPTURE_MANIFEST_FILE);
  if (!existsSync(manifestPath)) return false;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as {
    eventsFile?: string;
    runId?: string;
    scenarioId?: string;
    turn?: number;
  };
  return path.resolve(manifest.eventsFile ?? "") === resolved;
};

export const stampTrustedRunnerEvents = ({
  events,
  invocationId,
}: {
  events: EvalEvent[];
  invocationId: string;
}) =>
  events.map((event) => ({
    ...event,
    captureMethod: TRUSTED_CAPTURE_METHOD,
    invocationId,
    origin: "observed" as const,
  }));
