export type FiComposeIntent =
  | "integration-failure"
  | "duplicates"
  | "public-links"
  | "monthly-change"
  | "recent-decisions"
  | "prioritize-reporting"
  | "insufficient-evidence"
  | "search-fallback";

export const fiComposeRoutes: {
  id: FiComposeIntent;
  pattern: RegExp;
}[] = [
  {
    id: "integration-failure",
    pattern: /summarize integration|integration feedback/u,
  },
  { id: "duplicates", pattern: /duplicate|duplicates|same request/u },
  { id: "public-links", pattern: /public link|disagree/u },
  {
    id: "monthly-change",
    pattern: /changed|this month|feedback.*month/u,
  },
  {
    id: "recent-decisions",
    pattern: /last week|reviewed feedback|what happened/u,
  },
  { id: "prioritize-reporting", pattern: /priorit|reporting/u },
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
    if (route.id === "integration-failure") {
      if (route.pattern.test(q) && /fail|error/u.test(q)) return route.id;
      continue;
    }
    if (route.pattern.test(q)) return route.id;
  }
  return "search-fallback";
};
