import { getInsights } from "@repo/fi";
import { defineTool } from "eve/tools";
import { z } from "zod";

import { agentDb } from "../lib/db";

export default defineTool({
  description: "North-star product metrics for feature intelligence.",
  async execute() {
    return await getInsights({ db: agentDb() });
  },
  inputSchema: z.object({}),
});
