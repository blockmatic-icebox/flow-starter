import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

import { catalogRoot, oraclesDir, publicScenariosDir } from "./paths.ts";
import type {
  HiddenScenarioSpec,
  PublicScenarioCard,
  ScenarioOracle,
} from "./types.ts";

export const loadPublicScenario = ({ id }: { id: string }) => {
  const filePath = path.join(publicScenariosDir, `${id}.json`);
  return JSON.parse(readFileSync(filePath, "utf-8")) as PublicScenarioCard;
};

export const listPublicScenarioIds = () =>
  readdirSync(publicScenariosDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/u, ""))
    .toSorted();

/** Bounded default for `/flow-eval end-to-end` (diagnostic, not full catalog). */
export const listDefaultDiagnosticScenarioIds = () => [
  "S01",
  "S02",
  "S04",
  "S05",
  "S09",
  "S13",
  "S16",
];

export const loadHiddenScenario = ({ id }: { id: string }) => {
  const filePath = path.join(catalogRoot, id, "hidden.json");
  if (!existsSync(filePath)) return undefined;
  return JSON.parse(readFileSync(filePath, "utf-8")) as HiddenScenarioSpec;
};

export const loadScenarioOracle = ({ id }: { id: string }) => {
  const filePath = path.join(oraclesDir, `${id}.json`);
  if (!existsSync(filePath)) return undefined;
  return JSON.parse(readFileSync(filePath, "utf-8")) as ScenarioOracle;
};

export const scenarioOracleHash = () => {
  if (!existsSync(oraclesDir)) return "oracles-missing";
  const parts: string[] = [];
  for (const f of readdirSync(oraclesDir)
    .filter((n) => n.endsWith(".json"))
    .toSorted())
    parts.push(readFileSync(path.join(oraclesDir, f), "utf-8"));
  return createHash("sha256").update(parts.join("\n")).digest("hex");
};

export const catalogHash = () => {
  if (!existsSync(catalogRoot)) return "catalog-missing";
  const parts: string[] = [];
  for (const id of readdirSync(catalogRoot).toSorted()) {
    const hidden = path.join(catalogRoot, id, "hidden.json");
    const stakeholder = path.join(catalogRoot, id, "stakeholder.md");
    if (existsSync(hidden)) parts.push(readFileSync(hidden, "utf-8"));
    if (existsSync(stakeholder)) parts.push(readFileSync(stakeholder, "utf-8"));
  }
  return createHash("sha256").update(parts.join("\n")).digest("hex");
};
