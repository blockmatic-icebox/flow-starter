import path from "node:path";

import type { AcceptanceFamily } from "../../generation/types.ts";
import { repoRoot } from "../../paths.ts";

export const familyFixtureRoot = ({
  family,
  variant,
}: {
  family: AcceptanceFamily;
  variant: "good" | "bad";
}) => path.join(repoRoot, ".agents/eval/fixtures/products", family, variant);
