import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { loadBlindReview, mergeBlindScores } from "./blind-review.ts";
import { extractCommands } from "./evidence.ts";
import { gradeScenario } from "./grade.ts";
import {
  officialEligibilityBlockersFromIsolation,
  assessIsolation,
  SUBJECT_EVALUATOR_PROTOCOL_ID,
} from "./isolation.ts";
import { runEvalDir } from "./paths.ts";
import { resolveScenarioEvidenceDir } from "./scenario-evidence.ts";
import {
  loadHiddenScenario,
  loadPublicScenario,
  loadScenarioOracle,
} from "./scenarios.ts";
import { gradeObservedScenario } from "./session-grade.ts";
import { isBuildAuthorized } from "./stakeholder.ts";
import {
  HOST_SESSION_PROTOCOL_ID,
  isProtocolVerified,
  PROTOCOL_ID,
} from "./trace.ts";
import type {
  EvalEvent,
  GradeResult,
  HarnessKind,
  RunManifest,
} from "./types.ts";

const loadTranscriptEvents = ({ filePath }: { filePath: string }) => {
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
  if (manifest.protocol === SUBJECT_EVALUATOR_PROTOCOL_ID) return false;
  if (manifest.protocol === HOST_SESSION_PROTOCOL_ID) return false;
  if (manifest.protocol !== PROTOCOL_ID) return false;
  return isProtocolVerified({ agentCliVersion: manifest.agentCliVersion });
};

const isolationBlockersFromManifest = (manifest: RunManifest | null) => {
  if (!manifest) return ["missing-manifest"];
  if (manifest.isolationBlockers?.length) return manifest.isolationBlockers;
  if (manifest.protocol === SUBJECT_EVALUATOR_PROTOCOL_ID)
    return officialEligibilityBlockersFromIsolation(
      assessIsolation({
        host: manifest.host ?? "cursor",
        protocol: manifest.protocol,
      })
    );
  return [];
};

export const gradeScenarioFromRunDir = ({
  runId,
  scenarioId,
}: {
  runId: string;
  scenarioId: string;
}): GradeResult => {
  const scenarioDir = resolveScenarioEvidenceDir({ runId, scenarioId });
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
  const manifestPath = path.join(runEvalDir(runId), "manifest.json");
  const manifest = existsSync(manifestPath)
    ? (JSON.parse(readFileSync(manifestPath, "utf-8")) as RunManifest)
    : null;
  const blind = loadBlindReview({ runId, scenarioId });
  const worktreePath = existsSync(path.join(scenarioDir, "worktree-path.txt"))
    ? readFileSync(path.join(scenarioDir, "worktree-path.txt"), "utf-8").trim()
    : undefined;
  const harness = harnessFromManifest(manifest);
  const official =
    (harness === "cursor-cli" || harness === "host-session") && !malformed;

  let baseGrade = gradeObservedScenario({
    buildAuthorized: isBuildAuthorized({ events, hidden }),
    card,
    diff,
    events,
    harness,
    hidden,
    isolationBlockers: isolationBlockersFromManifest(manifest),
    official,
    oracle,
    protocol: manifest?.protocol,
    protocolVerified: malformed
      ? false
      : protocolVerifiedFromManifest(manifest),
    scenarioId,
    worktreePath,
  });

  baseGrade = {
    ...baseGrade,
    completeness: capCompleteness({
      computed: baseGrade.completeness,
      manifest,
    }),
  };

  if (!blind) return baseGrade;

  return gradeScenario({
    input: {
      buildAuthorized: isBuildAuthorized({ events, hidden }),
      card,
      commands,
      completeness: baseGrade.completeness,
      diff,
      events,
      harness,
      hidden,
      oracle,
      productOutcomePassed: baseGrade.productOutcomePassed,
      protocolVerified: malformed
        ? false
        : protocolVerifiedFromManifest(manifest),
      scenarioId,
    },
    scoresOverride: mergeBlindScores({
      base: baseGrade.scores,
      blind,
    }),
  });
};
