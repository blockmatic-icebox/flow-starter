import { createHash } from "node:crypto";

import type { SeededRng } from "./rng.ts";
import type { GeneratedScenario, ScenarioTemplate } from "./types.ts";

const modifierOptions = {
  ambiguityLevel: ["low", "medium", "high"],
  datasetSize: ["small", "medium", "large"],
  accessibility: ["baseline", "strict"],
  integrationAvailability: ["offline", "mocked", "degraded"],
  permissionModel: ["single-role", "multi-role"],
  errorScenarios: ["minimal", "explicit"],
  businessPriority: ["speed", "quality", "compliance"],
};

export const composeScenario = ({
  rng,
  template,
}: {
  rng: SeededRng;
  template: ScenarioTemplate;
}): GeneratedScenario => {
  const persona = rng.pick(template.personaVariants);
  const modifiers: Record<string, string> = {};
  for (const [key, values] of Object.entries(modifierOptions))
    modifiers[key] = rng.pick(values);

  const briefParts = [
    `# ${template.titleBase}`,
    "",
    `## Context`,
    template.productContext,
    "",
    `## Persona`,
    persona,
    "",
    `## Problem`,
    template.problemStem,
    "",
    `## Required outcomes`,
    ...template.outcomes.map((o) => `- ${o}`),
    "",
    `## Constraints`,
    ...template.constraints.map((c) => `- ${c}`),
    "",
    `## Modifiers`,
    ...Object.entries(modifiers).map(([k, v]) => `- ${k}: ${v}`),
    "",
    `## Acceptance (public)`,
    ...template.acceptanceCriteria.map((a) => `- ${a}`),
    "",
    `## Non-goals`,
    ...template.nonGoals.map((n) => `- ${n}`),
  ];

  const publicBrief = briefParts.join("\n");
  const slug = createHash("sha256")
    .update(template.templateId)
    .update(JSON.stringify(modifiers))
    .digest("hex")
    .slice(0, 8);
  const id = `GEN-${template.templateId}-${slug}`;

  const openingPrompt = `${template.problemStem}\n\nPersona: ${persona}.\nDomain: ${template.domain}.\nDeliver: ${template.outcomes.join("; ")}.\nConstraints: ${template.constraints.join("; ")}.`;

  const publicCard = {
    allowProductCode: template.codeExecution,
    allowStandalonePlan: !template.requiresBuildAuth,
    browserVerification: template.browserVerification,
    codeExecution: template.codeExecution,
    id,
    openingPrompt,
    relevantStages: template.relevantStages,
    requiresBuildAuth: template.requiresBuildAuth,
    title: `${template.titleBase} (${template.domain})`,
    turnCap: template.turnCap,
  };

  const hidden = {
    approvalLines: template.requiresBuildAuth
      ? [
          {
            authorizesBuild: true,
            message: "Authorized: proceed with Build.",
            turn: 4,
          },
        ]
      : [{ message: "Proceed with Specify.", turn: 3 }],
    alreadyKnown: template.constraints,
    id,
    injections: [],
    nonGoals: template.nonGoals,
    persona,
    privateFacts: [
      `Failure modes to watch: ${template.failureModes.join(", ")}`,
      `Holdout checks include edge cases not repeated in the public brief.`,
    ],
    stopCondition: template.requiresBuildAuth
      ? "after-build-verification"
      : "after-plan-approval",
  };

  const oracle = {
    acceptanceChecks: [
      ...template.acceptanceCriteria,
      `Modifiers honored: ${JSON.stringify(modifiers)}`,
    ],
    allowsProductCode: template.codeExecution,
    expectsCommands: template.codeExecution,
    expectsTools: template.codeExecution,
    holdoutNotes: template.failureModes.map((f) => `holdout:${f}`),
    requiresPassingTestCommand: template.codeExecution,
    scenarioId: id,
  };

  return {
    category: template.category,
    complexity: template.complexity,
    domain: template.domain,
    hidden,
    id,
    modifiers,
    oracle,
    publicBrief,
    publicCard,
    templateId: template.templateId,
  };
};

export const scenarioContentHash = ({
  scenario,
}: {
  scenario: GeneratedScenario;
}) => createHash("sha256").update(JSON.stringify(scenario)).digest("hex");
