import { getDb, searchRequests } from "@repo/fi";
import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Search published feature requests by text and optional theme key.",
  async execute({ query, themeKey, limit }) {
    const rows = await searchRequests({
      db: getDb(),
      limit,
      query,
      themeKey,
    });
    return {
      count: rows.length,
      requests: rows.map((r) => ({
        id: r.id,
        source: r.source,
        themeKey: r.themeKey,
        title: r.title,
      })),
    };
  },
  inputSchema: z.object({
    limit: z.number().int().min(1).max(50).optional(),
    query: z.string().optional(),
    themeKey: z.string().optional(),
  }),
});
