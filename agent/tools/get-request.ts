import { getRequest } from "@repo/fi";
import { defineTool } from "eve/tools";
import { z } from "zod";

import { agentDb } from "../lib/db";

export default defineTool({
  description: "Get a feature request by id with duplicates and support count.",
  async execute({ requestId }) {
    const detail = await getRequest({ db: agentDb(), requestId });
    if (!detail) return { found: false };
    return {
      found: true,
      request: detail.request,
      supportCount: detail.supportCount,
    };
  },
  inputSchema: z.object({
    requestId: z.string().uuid(),
  }),
});
