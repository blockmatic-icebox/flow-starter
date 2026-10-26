import { searchRequests } from "@repo/fi";
import { defineTool } from "eve/tools";
import { z } from "zod";

import { agentDb } from "../lib/db";

export default defineTool({
  description:
    "Search published Crewday feature requests by text and optional Crewday theme key.",
  async execute({ query, themeKey, limit }) {
    const result = await searchRequests({
      db: agentDb(),
      pageSize: limit ?? 25,
      query,
      themeKey,
    });
    const rows = result.items;
    return {
      count: rows.length,
      page: result.page,
      requests: rows.map((r) => ({
        id: r.id,
        source: r.source,
        supportCount: r.supportCount,
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
