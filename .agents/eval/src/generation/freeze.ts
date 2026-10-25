import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { devEvalsRoot } from "../paths.ts";
import { generationCatalogHash } from "./catalog-hash.ts";
import { scenarioContentHash } from "./compose.ts";
import type { ExperimentManifest, GeneratedScenario } from "./types.ts";

export const experimentDir = ({ experimentId }: { experimentId: string }) =>
  path.join(devEvalsRoot, "experiments", experimentId);

export const scenarioSnapshotDir = ({
  experimentId,
  scenarioId,
}: {
  experimentId: string;
  scenarioId: string;
}) => path.join(experimentDir({ experimentId }), "scenarios", scenarioId);

export const loadFrozenScenario = ({
  experimentId,
  scenarioId,
}: {
  experimentId: string;
  scenarioId?: string;
}): GeneratedScenario => {
  const manifestPath = path.join(
    experimentDir({ experimentId }),
    "manifest.json"
  );
  if (!existsSync(manifestPath))
    throw new Error(`missing experiment manifest at ${manifestPath}`);
  const manifest = JSON.parse(
    readFileSync(manifestPath, "utf-8")
  ) as ExperimentManifest;
  const id = scenarioId ?? manifest.scenarioIds[0];
  if (!id) throw new Error("no scenario id in manifest");
  const file = path.join(
    scenarioSnapshotDir({ experimentId, scenarioId: id }),
    "scenario.json"
  );
  if (!existsSync(file)) {
    const legacy = path.join(experimentDir({ experimentId }), "scenario.json");
    if (existsSync(legacy))
      return JSON.parse(readFileSync(legacy, "utf-8")) as GeneratedScenario;
    throw new Error(`missing frozen scenario at ${file}`);
  }
  return JSON.parse(readFileSync(file, "utf-8")) as GeneratedScenario;
};

export const verifyFrozenExperiment = ({
  experimentId,
}: {
  experimentId: string;
}) => {
  const manifestPath = path.join(
    experimentDir({ experimentId }),
    "manifest.json"
  );
  if (!existsSync(manifestPath))
    return { ok: false, reason: "missing manifest" };
  const manifest = JSON.parse(
    readFileSync(manifestPath, "utf-8")
  ) as ExperimentManifest;
  const issues: string[] = [];
  for (let i = 0; i < manifest.scenarioIds.length; i += 1) {
    const scenarioId = manifest.scenarioIds[i];
    const expectedHash = manifest.scenarioHashes[i];
    const scenario = loadFrozenScenario({ experimentId, scenarioId });
    const actual = scenarioContentHash({ scenario });
    if (actual !== expectedHash) issues.push(`hash mismatch for ${scenarioId}`);
  }
  return { issues, ok: issues.length === 0 };
};

export const freezeExperiment = ({
  experimentId,
  manifest,
  scenarios,
  allowOverwrite = false,
}: {
  experimentId: string;
  manifest: ExperimentManifest;
  scenarios: GeneratedScenario[];
  allowOverwrite?: boolean;
}) => {
  const dir = experimentDir({ experimentId });
  const manifestPath = path.join(dir, "manifest.json");
  if (existsSync(manifestPath) && !allowOverwrite) {
    const verify = verifyFrozenExperiment({ experimentId });
    if (!verify.ok)
      throw new Error(
        `experiment ${experimentId} exists with integrity issues: ${verify.issues?.join("; ")}`
      );
    return { dir, hashes: manifest.scenarioHashes, skipped: true };
  }

  mkdirSync(dir, { recursive: true });
  mkdirSync(path.join(dir, "oracle"), { recursive: true });
  mkdirSync(path.join(dir, "public"), { recursive: true });
  mkdirSync(path.join(dir, "scenarios"), { recursive: true });

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const hashes: string[] = [];
  const index: { id: string; hash: string; dir: string }[] = [];
  for (const scenario of scenarios) {
    const hash = scenarioContentHash({ scenario });
    hashes.push(hash);
    const snapDir = scenarioSnapshotDir({
      experimentId,
      scenarioId: scenario.id,
    });
    mkdirSync(snapDir, { recursive: true });
    writeFileSync(
      path.join(snapDir, "scenario.json"),
      JSON.stringify(scenario, null, 2)
    );
    writeFileSync(path.join(snapDir, "scenario-hash.txt"), `${hash}\n`);
    writeFileSync(
      path.join(dir, "public", `${scenario.id}-brief.md`),
      scenario.publicBrief
    );
    writeFileSync(
      path.join(dir, "oracle", `${scenario.id}-oracle.json`),
      JSON.stringify(scenario.oracle, null, 2)
    );
    index.push({ dir: snapDir, hash, id: scenario.id });
  }

  writeFileSync(
    path.join(dir, "scenario-index.json"),
    `${JSON.stringify({ scenarios: index }, null, 2)}\n`
  );

  if (scenarios.length === 1) {
    writeFileSync(
      path.join(dir, "scenario.json"),
      JSON.stringify(scenarios[0], null, 2)
    );
    writeFileSync(path.join(dir, "scenario-hash.txt"), `${hashes[0]}\n`);
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
