const tokenize = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter((t) => t.length > 2);

export const retrieveLexicalCandidates = ({
  title,
  description,
  published,
  limit,
}: {
  title: string;
  description: string;
  published: { id: string; title: string; description: string }[];
  limit: number;
}) => {
  const queryTokens = new Set(tokenize(`${title} ${description}`));

  const scored = published
    .map((row) => {
      const docTokens = tokenize(`${row.title} ${row.description}`);
      let overlap = 0;
      for (const t of docTokens) {
        if (queryTokens.has(t)) overlap += 1;
      }
      const score =
        docTokens.length === 0 ? 0 : overlap / Math.sqrt(docTokens.length);
      return {
        explanation: `Lexical overlap: ${overlap}`,
        id: row.id,
        score,
        title: row.title,
      };
    })
    .filter((r) => r.score > 0)
    .toSorted((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
};
