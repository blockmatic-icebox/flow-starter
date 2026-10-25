import { getDb, getInsights } from "@repo/fi";
import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "North-star product metrics for feature intelligence.",
  async execute() {
    return await getInsights({ db: getDb() });
  },
  inputSchema: z.object({}),
});
