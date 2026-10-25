import path from "node:path";

import { packageDirInRepo, repoRoot } from "../paths.ts";

export const technicalAiAssessmentRoot = path.join(
  repoRoot,
  packageDirInRepo,
  "fixtures/assessments/technical-ai-assessment"
);
