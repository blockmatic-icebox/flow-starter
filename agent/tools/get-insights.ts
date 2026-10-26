import { getInsights } from "@repo/fi";
import { defineTool } from "eve/tools";
import { z } from "zod";

import { agentDb } from "../lib/db";

export default defineTool({
  description:
    "Crewday feature-intelligence trends: themes, support, and strategic vs popular requests.",
  async execute() {
    return await getInsights({ db: agentDb() });
  },
  inputSchema: z.object({}),
});
