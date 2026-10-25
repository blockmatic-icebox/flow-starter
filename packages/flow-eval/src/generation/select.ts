import { isRegisteredFamily } from "../product/families/registry.ts";
import { scenarioTemplates } from "./catalog-data.ts";
import { composeScenario, scenarioContentHash } from "./compose.ts";
import type { SeededRng } from "./rng.ts";
import type {
  ExperimentProfile,
  GeneratedScenario,
  ScenarioTemplate,
  WorkCategory,
} from "./types.ts";
import { validateGeneratedScenario, validateTemplate } from "./validate.ts";

const categories = (): WorkCategory[] => [
  "new-product",
  "extension",
  "defect-repair",
  "ai-first-workflow",
  "data-workflow",
  "ux-improvement",
  "security",
  "integration",
  "architecture-constraint",
  "regression-recovery",
  "ambiguous-requirements",
  "performance-reliability",
];

const filterForProfile = ({ profile }: { profile: ExperimentProfile }) => {
  if (profile === "full-product")
    return scenarioTemplates.filter(
      (t) =>
        t.category === "new-product" &&
        t.complexity >= 3 &&
        t.acceptanceFamily &&
        isRegisteredFamily(t.acceptanceFamily)
    );
  if (profile === "mixed") return scenarioTemplates;
  return [];
};

export const selectGeneratedScenarios = ({
  count,
  profile,
  rng,
  maxAttempts = 8,
}: {
  count: number;
  profile: ExperimentProfile;
  rng: SeededRng;
  maxAttempts?: number;
}):
  | { ok: true; scenarios: GeneratedScenario[] }
  | { ok: false; reason: string } => {
  const pool = filterForProfile({ profile });
  if (!pool.length)
    return { ok: false, reason: `no templates for profile ${profile}` };

  const selected: GeneratedScenario[] = [];
  const usedTemplateIds = new Set<string>();
  const usedDomains = new Map<string, number>();

  const byCategory = new Map<WorkCategory, ScenarioTemplate[]>();
  for (const t of pool) {
    const list = byCategory.get(t.category) ?? [];
    list.push(t);
    byCategory.set(t.category, list);
  }

  const categoryOrder = rng.shuffle(
    categories().filter((c) => byCategory.has(c))
  );

  let attempt = 0;
  while (selected.length < count && attempt < maxAttempts * count * 2) {
    attempt += 1;
    const category =
      categoryOrder[selected.length % categoryOrder.length] ??
      rng.pick(pool).category;
    const candidates = (byCategory.get(category) ?? pool).filter(
      (t) => !usedTemplateIds.has(t.templateId)
    );
    if (!candidates.length) continue;

    const domainCap = Math.ceil(count / 3);
    const template =
      candidates.find((t) => (usedDomains.get(t.domain) ?? 0) < domainCap) ??
      rng.pick(candidates);

    const templateCheck = validateTemplate({ template });
    if (!templateCheck.ok) continue;

    const scenario = composeScenario({ rng, template });
    const scenarioCheck = validateGeneratedScenario({ scenario });
    if (!scenarioCheck.ok) continue;

    if (
      selected.some(
        (s) =>
          scenarioContentHash({ scenario: s }) ===
          scenarioContentHash({ scenario })
      )
    )
      continue;

    selected.push(scenario);
    usedTemplateIds.add(template.templateId);
    usedDomains.set(
      template.domain,
      (usedDomains.get(template.domain) ?? 0) + 1
    );
  }

  if (selected.length < count)
    return {
      ok: false,
      reason: `generation failed after ${attempt} attempts: got ${selected.length}/${count}`,
    };

  return { ok: true, scenarios: selected };
};
