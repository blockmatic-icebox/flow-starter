import { listTriageQueue } from "@repo/fi";
import { defineTool } from "eve/tools";
import { z } from "zod";

import { agentDb } from "../lib/db";

export default defineTool({
  description: "List published requests awaiting PM disposition.",
  async execute() {
    const rows = await listTriageQueue({ db: agentDb() });
    return {
      count: rows.length,
      requests: rows.map((r) => ({
        decisionBrief: r.decisionBrief,
        id: r.id,
        themeKey: r.themeKey,
        title: r.title,
      })),
    };
  },
  inputSchema: z.object({}),
});
