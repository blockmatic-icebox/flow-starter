import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

type Requirement = { id: string; title: string; releaseBlocking: boolean };

type HoldoutChecks = {
  ai: { live: string[]; mock: string[]; qualitative: string[] };
  functional: string[];
  harnessVersion: string;
};

const readJson = <T>({ filePath }: { filePath: string }) =>
  JSON.parse(readFileSync(filePath, "utf-8")) as T;

const writeJson = ({ filePath, value }: { filePath: string; value: unknown }) =>
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);

export const loadAssessmentFixture = () => {
  const requirements = readJson<Requirement[]>({
    filePath: path.join(technicalAiAssessmentRoot, "requirements.json"),
  });
  const corpus = readJson<unknown>({
    filePath: path.join(technicalAiAssessmentRoot, "evaluation/corpus.json"),
  });
  const holdout = readJson<HoldoutChecks>({
    filePath: path.join(
      technicalAiAssessmentRoot,
      "evaluation/holdout-checks.json"
    ),
  });
  return { corpus, holdout, requirements };
};

const acceptanceItems = ({ holdout }: { holdout: HoldoutChecks }) => [
  ...holdout.functional.map((item) => ({
    area: "functional",
    item,
    status: "unverified" as const,
  })),
  ...holdout.ai.mock.map((item) => ({
    area: "ai-mock",
    item,
    status: "unverified" as const,
  })),
  ...holdout.ai.live.map((item) => ({
    area: "ai-live",
    item,
    status: "unverified" as const,
  })),
  ...holdout.ai.qualitative.map((item) => ({
    area: "ai-qualitative",
    item,
    status: "unverified" as const,
  })),
];

const personas: Record<AssessmentArm, string> = {
  "assessment-a": "lean-saas-pm.md",
  "assessment-b": "enterprise-ops.md",
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
  const brief = readFileSync(
    path.join(technicalAiAssessmentRoot, "brief.md"),
    "utf-8"
  );
  const journeys = readJson<string[]>({
    filePath: path.join(
      technicalAiAssessmentRoot,
      "evaluation/browser-journeys.json"
    ),
  });
  const acceptance = acceptanceItems({ holdout: fixture.holdout });
  const lifecycle: AssessmentLifecycle = "initialized";
  const arms: AssessmentArm[] = ["assessment-a", "assessment-b"];

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
      writeJson({
        filePath: path.join(armDir, "manifest.json"),
        value: {
          arm,
          baselineSha,
          developmentReady: true,
          fixtureVersion: fixture.holdout.harnessVersion,
          lifecycle,
          personaFile: personas[arm],
          productEvaluated: false,
          releaseVerdict: "INCONCLUSIVE",
          requirements: fixture.requirements.map(
            (requirement) => requirement.id
          ),
          runId,
          targetArm: "assessment-a",
        },
      });
      writeFileSync(path.join(armDir, "persona.md"), persona);
      writeFileSync(path.join(armDir, "brief.md"), brief);
      writeJson({
        filePath: path.join(armDir, "requirements.json"),
        value: fixture.requirements,
      });
      writeJson({
        filePath: path.join(armDir, "corpus.json"),
        value: fixture.corpus,
      });
      writeJson({
        filePath: path.join(armDir, "holdout-checks.json"),
        value: fixture.holdout,
      });
      writeJson({
        filePath: path.join(armDir, "browser-journeys.json"),
        value: journeys,
      });
      writeJson({
        filePath: path.join(armDir, "acceptance.json"),
        value: acceptance,
      });
      writeJson({
        filePath: path.join(armDir, "lifecycle.json"),
        value: {
          lifecycle,
          reason:
            "Session prepared. Holdout checks stay unverified until the product slice covers them.",
        },
      });
      writeFileSync(
        path.join(armDir, "session.md"),
        [
          "# Development session",
          "",
          "Lifecycle: initialized.",
          "Release verdict: INCONCLUSIVE.",
          "",
          "Build target: assessment-a, the lean SaaS product manager.",
          "assessment-b holds the enterprise persona for a later comparison.",
          "",
          "Next action: implement the first slice in docs/initiatives/feature-intelligence.md.",
          "Each item in acceptance.json stays unverified until a product check covers it.",
          "",
        ].join("\n")
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
    developmentReady: true,
    nextStep:
      "Implement the first slice in docs/initiatives/feature-intelligence.md. Holdout checks are unverified.",
    ok: true,
    productEvaluated: false,
    releaseVerdict: "INCONCLUSIVE" as const,
    results,
    runId,
    targetArm: "assessment-a" as const,
    terminal: "initialized" as const,
  };
};
