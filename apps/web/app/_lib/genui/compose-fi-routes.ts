export type FiComposeIntent =
  | "prioritize-scheduling"
  | "duplicate-swap"
  | "approval-conflict"
  | "strongest-evidence"
  | "emerging-month"
  | "popular-decline"
  | "open-queue-attention"
  | "notification-evidence"
  | "insufficient-evidence"
  | "search-fallback";

export const fiComposeRoutes: {
  id: Exclude<FiComposeIntent, "search-fallback">;
  pattern: RegExp;
}[] = [
  {
    id: "prioritize-scheduling",
    pattern:
      /what scheduling problems should crewday prioritize|scheduling problems.*priorit|priorit.*scheduling/u,
  },
  {
    id: "duplicate-swap",
    pattern:
      /same shift-?swap|shift-?swap issue in different|reporting the same shift|\bduplicate|\bduplicates\b/u,
  },
  {
    id: "approval-conflict",
    pattern:
      /managers? and employees? disagree|disagreeing about shift approvals|shift approvals/u,
  },
  {
    id: "strongest-evidence",
    pattern: /strongest evidence|which customer problems have the strongest/u,
  },
  {
    id: "emerging-month",
    pattern: /emerging issues|appeared in the last month|feedback this month/u,
  },
  {
    id: "popular-decline",
    pattern: /decline a popular|why did we decline|popular request/u,
  },
  {
    id: "open-queue-attention",
    pattern:
      /open requests need product manager|need product manager attention|which open requests/u,
  },
  {
    id: "notification-evidence",
    pattern:
      /shift-change notifications|improving shift-change|evidence supports improving.*notification/u,
  },
  {
    id: "insufficient-evidence",
    pattern: /insufficient|not enough|no evidence/u,
  },
];

export const matchFiComposeIntent = (
  query: string
): FiComposeIntent | "search-fallback" => {
  const q = query.trim().toLowerCase();
  for (const route of fiComposeRoutes) {
    if (route.pattern.test(q)) return route.id;
  }
  return "search-fallback";
};
