import { loadPublicScenario } from "./scenarios.ts";

export type EvalCommandContext =
  | "host-prepare"
  | "integrity"
  | "preserve"
  | "readiness"
  | "stress"
  | "grade";

export const requiresDatabase = ({
  command,
  scenarioId,
}: {
  command?: EvalCommandContext;
  scenarioId?: string;
}) => {
  if (command === "readiness" || command === "stress") return true;
  if (!scenarioId) return false;
  try {
    const card = loadPublicScenario({ id: scenarioId });
    if (card.persistence === "required") return true;
  } catch {
    return false;
  }
  return false;
};
