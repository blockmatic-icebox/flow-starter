import { isRegisteredFamily } from "../product/families/registry.ts";
import type { GeneratedScenario, ScenarioTemplate } from "./types.ts";

export const validateTemplate = ({
  template,
}: {
  template: ScenarioTemplate;
}) => {
  const errors: string[] = [];
  if (!template.templateId) errors.push("missing templateId");
  if (template.turnCap < 1 || template.turnCap > 20)
    errors.push("turnCap out of range");
  if (!template.problemStem.trim()) errors.push("missing problem");
  if (!template.outcomes.length) errors.push("missing outcomes");
  for (const pre of template.fixturePreconditions)
    if (pre !== "none") errors.push(`unknown fixture precondition: ${pre}`);
  if (
    template.category === "new-product" &&
    template.complexity >= 3 &&
    (!template.acceptanceFamily ||
      !isRegisteredFamily(template.acceptanceFamily))
  )
    errors.push("full-product template missing executable acceptanceFamily");
  return { ok: errors.length === 0, errors };
};

export const validateGeneratedScenario = ({
  scenario,
}: {
  scenario: GeneratedScenario;
}) => {
  const errors: string[] = [];
  if (!scenario.publicCard.openingPrompt.trim())
    errors.push("empty openingPrompt");
  if (scenario.publicCard.id !== scenario.id) errors.push("id mismatch");
  if (!scenario.oracle.acceptanceChecks.length)
    errors.push("oracle missing acceptanceChecks");
  if (scenario.publicBrief.length < 80) errors.push("brief too short");
  if (
    scenario.category === "new-product" &&
    scenario.complexity >= 3 &&
    (!scenario.oracle.acceptanceFamily ||
      !isRegisteredFamily(String(scenario.oracle.acceptanceFamily)))
  )
    errors.push("generated scenario lacks executable acceptance adapter");
  return { ok: errors.length === 0, errors };
};
