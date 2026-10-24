import { flowKnowledgeSections } from "./knowledge-snapshot";

const allowedPaths = new Set<string>(
  flowKnowledgeSections.map((section) => section.path)
);

export const listKnowledgeDocuments = () =>
  flowKnowledgeSections.map((section) => ({
    path: section.path,
    preview: section.content.slice(0, 240).replaceAll(/\s+/gu, " ").trim(),
  }));

export const readKnowledgeDocument = (documentPath: string) => {
  const normalized = documentPath.trim();
  if (!allowedPaths.has(normalized)) {
    return {
      message: `Unknown document. Allowed: ${[...allowedPaths].join(", ")}`,
      ok: false as const,
    };
  }
  const section = flowKnowledgeSections.find(
    (entry) => entry.path === normalized
  );
  if (!section) {
    return { message: "Document not found in snapshot.", ok: false as const };
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
      return { score, section };
    })
    .filter((entry) => entry.score > 0);

  const ranked = [...scored].sort((a, b) => b.score - a.score).slice(0, limit);

  return {
    hits: ranked.map(({ section }) => {
      const lower = section.content.toLowerCase();
      const firstTerm =
        terms.find((term) => lower.includes(term)) ?? terms[0] ?? "";
      const index = lower.indexOf(firstTerm);
      const start = Math.max(0, index - 120);
      const excerpt = section.content.slice(start, start + 360).trim();
      return { excerpt, path: section.path };
    }),
  };
};
