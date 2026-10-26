import { SupportRequestError, supportRequest } from "@repo/fi";
import { defineTool } from "eve/tools";
import { z } from "zod";

import { agentDb } from "../lib/db";

export default defineTool({
  description: "Add support for a published feature request.",
  async execute({ requestId, supporterKey }) {
    try {
      return await supportRequest({
        db: agentDb(),
        requestId,
        supporterKey,
      });
    } catch (error) {
      if (error instanceof SupportRequestError)
        return { error: `${error.code}: ${error.message}` };
      throw error;
    }
  },
  inputSchema: z.object({
    requestId: z.string().uuid(),
    supporterKey: z.string().min(1).max(200),
  }),
});
