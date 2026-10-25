import { themeRegistry } from "./registry";
import type { ThemeKey } from "./registry";

const scoreTheme = ({
  text,
  keywords,
}: {
  text: string;
  keywords: readonly string[];
}) => {
  if (keywords.length === 0) return 0;
  const hits = keywords.filter((k) => text.includes(k)).length;
  return Math.min(1, hits / Math.max(2, keywords.length * 0.5));
};

export const classifyThemeDeterministic = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  const text = `${title} ${description}`.toLowerCase();

  let bestKey: ThemeKey = "platform_other";
  let bestScore = 0;

  for (const [key, meta] of Object.entries(themeRegistry)) {
    if (key === "platform_other") continue;
    const score = scoreTheme({ keywords: meta.keywords, text });
    if (score > bestScore) {
      bestScore = score;
      bestKey = key as ThemeKey;
    }
  }

  const confidence = bestScore > 0 ? Math.min(0.95, 0.5 + bestScore) : 0.3;
  const skippedJev = confidence >= 0.9;

  return {
    confidence,
    skippedJev,
    themeKey: skippedJev || bestScore > 0.4 ? bestKey : "platform_other",
  };
};
