import type { FeatureRequest, TriagePriority } from "./types";

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter((token) => token.length > 2);

const overlapScore = (a: string, b: string) => {
  const left = new Set(tokenize(a));
  const right = new Set(tokenize(b));
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / Math.max(left.size, right.size);
};

const themeRules: { theme: string; keywords: string[] }[] = [
  {
    keywords: ["slack", "integration", "webhook", "api"],
    theme: "integrations",
  },
  { keywords: ["export", "csv", "report", "analytics"], theme: "reporting" },
  {
    keywords: ["mobile", "responsive", "screenshot", "ux", "ui"],
    theme: "experience",
  },
  { keywords: ["security", "auth", "sso", "permission"], theme: "security" },
];

export const inferTheme = (text: string) => {
  const lower = text.toLowerCase();
  let best = { hits: 0, theme: "product" };
  for (const rule of themeRules) {
    const hits = rule.keywords.filter((keyword) =>
      lower.includes(keyword)
    ).length;
    if (hits > best.hits) best = { hits, theme: rule.theme };
  }
  return best.theme;
};

export const inferPriority = ({
  relatedCount,
  supportCount,
}: {
  relatedCount: number;
  supportCount: number;
}): TriagePriority => {
  const score = supportCount + relatedCount * 2;
  if (score >= 10) return "high";
  if (score >= 4) return "medium";
  return "low";
};

export const fixtureTriage = ({
  request,
  requests,
}: {
  request: FeatureRequest;
  requests: FeatureRequest[];
}) => {
  const corpus = `${request.title} ${request.description}`;
  const related = requests
    .filter((item) => item.id !== request.id)
    .map((item) => ({
      id: item.id,
      score: overlapScore(corpus, `${item.title} ${item.description}`),
      title: item.title,
    }))
    .filter((item) => item.score >= 0.15)
    .toSorted((a, b) => b.score - a.score)
    .slice(0, 3);

  const suggestedTheme = inferTheme(corpus);
  const priority = inferPriority({
    relatedCount: related.length,
    supportCount: request.supportCount,
  });

  const relatedTitles =
    related.length > 0
      ? related.map((item) => `“${item.title}”`).join(", ")
      : "no close matches in the catalog";

  return {
    mode: "fixture" as const,
    priority,
    rationale: `Fixture triage grouped this request under “${suggestedTheme}” with ${priority} priority based on keyword themes, ${request.supportCount} supporters, and lexical overlap with ${relatedTitles}. Confirm or adjust before prioritization.`,
    relatedIds: related.map((item) => item.id),
    suggestedTheme,
  };
};
