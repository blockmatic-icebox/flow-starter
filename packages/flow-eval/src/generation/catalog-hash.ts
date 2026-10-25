import { createHash } from "node:crypto";

import { scenarioTemplates } from "./catalog-data.ts";
import { GENERATOR_VERSION } from "./types.ts";

export const generationCatalogHash = () =>
  createHash("sha256")
    .update(GENERATOR_VERSION)
    .update(JSON.stringify(scenarioTemplates))
    .digest("hex");
