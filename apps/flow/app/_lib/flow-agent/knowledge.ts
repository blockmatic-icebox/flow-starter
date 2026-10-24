import { flowKnowledgeSections } from "./knowledge-snapshot";

type KnowledgeSection = (typeof flowKnowledgeSections)[number];

const knowledgeByPath = new Map<string, KnowledgeSection>(
  flowKnowledgeSections.map((section) => [section.path, section])
);

const allowedPathsList = [...knowledgeByPath.keys()].join(", ");

const sectionHeadingPattern = /^#{2,6}\s+(?<heading>.+)$/u;

const sectionIndexFor = (content: string) => {
  const lines = content.split("\n");
  const sections: { heading: string; start: number; level: number }[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const match = sectionHeadingPattern.exec(lines[index] ?? "");
    const heading = match?.groups?.heading?.trim();
    if (!heading) continue;
    const level = (lines[index] ?? "").match(/^#+/u)?.[0].length ?? 2;
    sections.push({
      heading,
      level,
      start: index,
    });
  }

  return sections;
};

export const listKnowledgeDocuments = () =>
  flowKnowledgeSections.map((section) => {
    const headings = sectionIndexFor(section.content)
      .filter((entry) => entry.level === 2)
      .map((entry) => entry.heading);
    return {
      headings,
      path: section.path,
      preview: section.content.slice(0, 240).replaceAll(/\s+/gu, " ").trim(),
    };
  });

const sliceSection = ({
  content,
  heading,
}: {
  content: string;
  heading: string;
}) => {
  const normalized = heading.trim().toLowerCase();
  const sections = sectionIndexFor(content);
  const index = sections.findIndex(
    (entry) => entry.heading.toLowerCase() === normalized
  );
  if (index === -1) return null;

  const current = sections[index];
  if (!current) return null;
  const lines = content.split("\n");
  let end = lines.length;
  for (let i = index + 1; i < sections.length; i += 1) {
    const next = sections[i];
    if (next && next.level <= current.level) {
      end = next.start;
      break;
    }
  }

  const excerpt = lines.slice(current.start, end).join("\n").trim();
  const maxChars = 12_000;
  if (excerpt.length <= maxChars) return excerpt;
  return `${excerpt.slice(0, maxChars)}\n\n… (section truncated)`;
};

export const readKnowledgeDocument = ({
  path: documentPath,
  section,
}: {
  path: string;
  section?: string;
}) => {
  const normalized = documentPath.trim();
  const entry = knowledgeByPath.get(normalized);
  if (!entry) {
    return {
      message: `Unknown document. Allowed: ${allowedPathsList}`,
      ok: false as const,
    };
  }

  if (section?.trim()) {
    const excerpt = sliceSection({
      content: entry.content,
      heading: section.trim(),
    });
    if (!excerpt) {
      const headings = sectionIndexFor(entry.content)
        .filter((item) => item.level === 2)
        .map((item) => item.heading);
      return {
        message: `Unknown section "${section.trim()}". Top-level sections: ${headings.join(", ")}`,
        ok: false as const,
      };
    }
    return {
      ok: true as const,
      path: entry.path,
      section: section.trim(),
      text: excerpt,
    };
  }

  const maxChars = 16_000;
  const text =
    entry.content.length <= maxChars
      ? entry.content
      : `${entry.content.slice(0, maxChars)}\n\n… (document truncated; pass section for a bounded excerpt)`;

  return {
    ok: true as const,
    path: entry.path,
    text,
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
