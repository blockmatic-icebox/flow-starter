import { flowKnowledgeSections } from "./knowledge-snapshot";

type KnowledgeSection = (typeof flowKnowledgeSections)[number];

const knowledgeByPath = new Map<string, KnowledgeSection>(
  flowKnowledgeSections.map((section) => [section.path, section])
);

const allowedPathsList = [...knowledgeByPath.keys()].join(", ");

export const listKnowledgeDocuments = () =>
  flowKnowledgeSections.map((section) => ({
    path: section.path,
    preview: section.content.slice(0, 240).replaceAll(/\s+/gu, " ").trim(),
  }));

export const readKnowledgeDocument = (documentPath: string) => {
  const normalized = documentPath.trim();
  const section = knowledgeByPath.get(normalized);
  if (!section) {
    return {
      message: `Unknown document. Allowed: ${allowedPathsList}`,
      ok: false as const,
    };
  }
  return {
    ok: true as const,
    path: section.path,
    text: section.content,
  };
};

export const searchKnowledge = (query: string, { limit = 3 } = {}) => {
  const terms = query
    .toLowerCase()
    .split(/\s+/u)
    .filter((term) => term.length > 2);
  if (terms.length === 0) {
    return { hits: [] as { path: string; excerpt: string }[] };
  }

  const scored = flowKnowledgeSections
    .map((section) => {
      const lower = section.content.toLowerCase();
      const score = terms.reduce(
        (total, term) => total + (lower.includes(term) ? 1 : 0),
        0
      );
      return { lower, score, section };
    })
    .filter((entry) => entry.score > 0);

  const ranked = [...scored].sort((a, b) => b.score - a.score).slice(0, limit);

  return {
    hits: ranked.map(({ lower, section }) => {
      const firstTerm =
        terms.find((term) => lower.includes(term)) ?? terms[0] ?? "";
      const index = lower.indexOf(firstTerm);
      const start = Math.max(0, index - 120);
      const excerpt = section.content.slice(start, start + 360).trim();
      return { excerpt, path: section.path };
    }),
  };
};
