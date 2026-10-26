import { supportRequest } from "@repo/fi";
import { defineTool } from "eve/tools";
import { z } from "zod";

import { agentDb } from "../lib/db";

export default defineTool({
  description: "Add support for a published feature request.",
  async execute({ requestId, supporterKey }) {
    const result = await supportRequest({
      db: agentDb(),
      requestId,
      supporterKey,
    });
    return result;
  },
  inputSchema: z.object({
    requestId: z.string().uuid(),
    supporterKey: z.string().min(1).max(200),
  }),
});
