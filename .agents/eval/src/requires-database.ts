import { loadPublicScenario } from "./scenarios.ts";
import type { PublicScenarioCard } from "./types.ts";

export type EvalCommandContext =
  | "host-prepare"
  | "integrity"
  | "preserve"
  | "readiness"
  | "stress"
  | "grade";

export const requiresDatabase = ({
  command,
  scenarioCard,
  scenarioId,
}: {
  command?: EvalCommandContext;
  scenarioCard?: Pick<PublicScenarioCard, "persistence">;
  scenarioId?: string;
}) => {
  if (command === "readiness" || command === "stress") return true;
  if (scenarioCard?.persistence === "required") return true;
  if (!scenarioId) return false;
  try {
    const card = loadPublicScenario({ id: scenarioId });
    if (card.persistence === "required") return true;
  } catch {
    return false;
  }
  return false;
};
