export type HandoffVariant = "C1" | "C2" | "C3";

export const handoffAgentBPrompt = ({
  variant,
}: {
  variant: HandoffVariant;
}) => {
  if (variant === "C1")
    return "Continue the approved PennyPilot slice. Do not rediscover the problem from scratch.";
  if (variant === "C2")
    return "Continue implementation from the last Build slice. Run verification on what exists before adding scope.";
  return "The stakeholder changed cancellation policy. Continue from repository documents only; do not assume the old brief still applies.";
};
