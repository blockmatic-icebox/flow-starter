import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { mapWithConcurrency } from "../concurrency.ts";
import { repoRoot } from "../paths.ts";
import { technicalAiAssessmentRoot } from "./paths.ts";

export type AssessmentArm = "assessment-a" | "assessment-b";

export type AssessmentLifecycle =
  | "initialized"
  | "running"
  | "built"
  | "evaluating"
  | "remediating"
  | "verified"
  | "blocked"
  | "failed";

export const loadAssessmentFixture = () => {
  const requirements = JSON.parse(
    readFileSync(
      path.join(technicalAiAssessmentRoot, "requirements.json"),
      "utf-8"
    )
  ) as { id: string; title: string; releaseBlocking: boolean }[];
  const corpus = JSON.parse(
    readFileSync(
      path.join(technicalAiAssessmentRoot, "evaluation/corpus.json"),
      "utf-8"
    )
  );
  const holdout = JSON.parse(
    readFileSync(
      path.join(technicalAiAssessmentRoot, "evaluation/holdout-checks.json"),
      "utf-8"
    )
  );
  return { corpus, holdout, requirements };
};

export const runTechnicalAiAssessmentPair = async ({
  baselineSha,
  concurrency = 2,
  runId,
}: {
  baselineSha: string;
  concurrency?: number;
  runId: string;
}) => {
  const fixture = loadAssessmentFixture();
  const productEvalRoot = path.join(repoRoot, "__dev", "product-evals");
  mkdirSync(productEvalRoot, { recursive: true });

  const arms: AssessmentArm[] = ["assessment-a", "assessment-b"];
  const personas = {
    "assessment-a": "lean-saas-pm.md",
    "assessment-b": "enterprise-ops.md",
  };

  const results = await mapWithConcurrency({
    concurrency,
    items: arms,
    worker: (arm) => {
      const armDir = path.join(productEvalRoot, `${arm}-${runId}`);
      mkdirSync(armDir, { recursive: true });
      const persona = readFileSync(
        path.join(technicalAiAssessmentRoot, "personas", personas[arm]),
        "utf-8"
      );
      writeFileSync(
        path.join(armDir, "manifest.json"),
        `${JSON.stringify(
          {
            arm,
            baselineSha,
            fixtureVersion: fixture.holdout.harnessVersion,
            personaFile: personas[arm],
            requirements: fixture.requirements.map((r) => r.id),
            runId,
          },
          null,
          2
        )}\n`
      );
      writeFileSync(path.join(armDir, "persona.md"), persona);
      const lifecycle: AssessmentLifecycle = "blocked";
      writeFileSync(
        path.join(armDir, "lifecycle.json"),
        `${JSON.stringify(
          {
            lifecycle,
            reason:
              "Assessment pair requires built products and holdout evaluation; build stage not executed in this run.",
          },
          null,
          2
        )}\n`
      );
      return Promise.resolve({
        arm,
        armDir,
        lifecycle,
        status: lifecycle,
      });
    },
  });

  return {
    fixture,
    ok: false,
    results,
    runId,
    terminal: "blocked",
  };
};
