import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { devEvalsRoot } from "../paths.ts";
import { generationCatalogHash } from "./catalog-hash.ts";
import { scenarioContentHash } from "./compose.ts";
import type { ExperimentManifest, GeneratedScenario } from "./types.ts";

export const experimentDir = ({ experimentId }: { experimentId: string }) =>
  path.join(devEvalsRoot, "experiments", experimentId);

export const freezeExperiment = ({
  experimentId,
  manifest,
  scenarios,
}: {
  experimentId: string;
  manifest: ExperimentManifest;
  scenarios: GeneratedScenario[];
}) => {
  const dir = experimentDir({ experimentId });
  mkdirSync(dir, { recursive: true });
  mkdirSync(path.join(dir, "oracle"), { recursive: true });
  mkdirSync(path.join(dir, "public"), { recursive: true });

  writeFileSync(
    path.join(dir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  const hashes: string[] = [];
  for (const scenario of scenarios) {
    const hash = scenarioContentHash({ scenario });
    hashes.push(hash);
    const scenarioPath = path.join(dir, "scenario.json");
    writeFileSync(
      path.join(dir, `scenario-${scenario.id}.json`),
      JSON.stringify(scenario, null, 2)
    );
    writeFileSync(path.join(dir, "scenario-hash.txt"), `${hash}\n`);
    writeFileSync(
      path.join(dir, "public", `${scenario.id}-brief.md`),
      scenario.publicBrief
    );
    writeFileSync(
      path.join(dir, "oracle", `${scenario.id}-oracle.json`),
      JSON.stringify(scenario.oracle, null, 2)
    );
    writeFileSync(scenarioPath, JSON.stringify(scenario, null, 2));
  }

  return { dir, hashes };
};

export const buildManifest = ({
  arm,
  experimentId,
  model,
  profile,
  seed,
  sourceSha,
  scenarioIds,
  scenarioHashes,
  strategy,
}: {
  arm: string;
  experimentId: string;
  model: string;
  profile: ExperimentManifest["profile"];
  seed: string;
  sourceSha: string;
  scenarioIds: string[];
  scenarioHashes: string[];
  strategy: ExperimentManifest["strategy"];
}): ExperimentManifest => ({
  catalogHash: generationCatalogHash(),
  createdAt: new Date().toISOString(),
  evaluationArm: arm,
  experimentId,
  generatorVersion: "1",
  model,
  profile,
  scenarioHashes,
  scenarioIds,
  seed,
  sourceSha,
  strategy,
});
