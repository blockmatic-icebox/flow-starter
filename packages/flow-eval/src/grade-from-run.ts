import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { loadBlindReview, mergeBlindScores } from "./blind-review.ts";
import { extractCommands } from "./evidence.ts";
import { gradeScenario } from "./grade.ts";
import { devEvalsRoot } from "./paths.ts";
import {
  loadHiddenScenario,
  loadPublicScenario,
  loadScenarioOracle,
} from "./scenarios.ts";
import { isBuildAuthorized } from "./stakeholder.ts";
import {
  isProtocolVerified,
  PROTOCOL_ID,
  sessionCompletenessFromEvents,
} from "./trace.ts";
import type {
  Completeness,
  EvalEvent,
  GradeResult,
  HarnessKind,
  RunManifest,
} from "./types.ts";

export const loadTranscriptEvents = ({ filePath }: { filePath: string }) => {
  if (!existsSync(filePath))
    return { events: [] as EvalEvent[], malformed: false };
  let malformed = false;
  const events = readFileSync(filePath, "utf-8")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as EvalEvent;
      } catch {
        malformed = true;
        return null;
      }
    })
    .filter((event): event is EvalEvent => event !== null);
  return { events, malformed };
};

const capCompleteness = ({
  computed,
  manifest,
}: {
  computed: RunManifest["completeness"];
  manifest: RunManifest | null;
}) => {
  if (!manifest) return computed;
  if (manifest.completeness === "blocked") return "blocked";
  if (manifest.completeness === "partial" && computed === "complete")
    return "partial";
  return computed;
};

const harnessFromManifest = (manifest: RunManifest | null): HarnessKind => {
  if (!manifest?.harness) return "diagnostic-unofficial";
  return manifest.harness;
};

const protocolVerifiedFromManifest = (manifest: RunManifest | null) => {
  if (!manifest) return false;
  if (manifest.protocol !== PROTOCOL_ID) return false;
  return isProtocolVerified({ agentCliVersion: manifest.agentCliVersion });
};

export const gradeScenarioFromRunDir = ({
  runId,
  scenarioId,
}: {
  runId: string;
  scenarioId: string;
}): GradeResult => {
  const scenarioDir = path.join(devEvalsRoot, runId, "scenarios", scenarioId);
  const diff = existsSync(path.join(scenarioDir, "diff.patch"))
    ? readFileSync(path.join(scenarioDir, "diff.patch"), "utf-8")
    : "";
  const { events, malformed } = loadTranscriptEvents({
    filePath: path.join(scenarioDir, "transcript.jsonl"),
  });
  const commandsPath = path.join(scenarioDir, "commands.json");
  const commands = existsSync(commandsPath)
    ? (
        JSON.parse(readFileSync(commandsPath, "utf-8")) as {
          commands: ReturnType<typeof extractCommands>;
        }
      ).commands
    : extractCommands({ events });
  const card = loadPublicScenario({ id: scenarioId });
  const hidden = loadHiddenScenario({ id: scenarioId });
  const oracle = loadScenarioOracle({ id: scenarioId });
  const manifestPath = path.join(devEvalsRoot, runId, "manifest.json");
  const manifest = existsSync(manifestPath)
    ? (JSON.parse(readFileSync(manifestPath, "utf-8")) as RunManifest)
    : null;
  const blind = loadBlindReview({ runId, scenarioId });

  let completeness: Completeness = sessionCompletenessFromEvents({
    events,
    oracle,
  });
  if (malformed) completeness = "partial";
  completeness = capCompleteness({ computed: completeness, manifest });

  const protocolVerified = malformed
    ? false
    : protocolVerifiedFromManifest(manifest);

  const baseGrade = gradeScenario({
    input: {
      buildAuthorized: isBuildAuthorized({ events, hidden }),
      card,
      commands,
      completeness,
      diff,
      events,
      harness: harnessFromManifest(manifest),
      hidden,
      oracle,
      protocolVerified,
      scenarioId,
    },
  });

  if (!blind) return baseGrade;

  return gradeScenario({
    input: {
      buildAuthorized: isBuildAuthorized({ events, hidden }),
      card,
      commands,
      completeness,
      diff,
      events,
      harness: harnessFromManifest(manifest),
      hidden,
      oracle,
      protocolVerified,
      scenarioId,
    },
    scoresOverride: mergeBlindScores({
      base: baseGrade.scores,
      blind,
    }),
  });
};
