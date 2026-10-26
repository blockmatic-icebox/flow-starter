import { DispositionError, setDisposition } from "@repo/fi";
import { defineTool } from "eve/tools";
import { z } from "zod";

import { agentDb } from "../lib/db";

export default defineTool({
  description: "Set PM disposition on a published feature request.",
  async execute({
    requestId,
    disposition,
    dispositionRationale,
    mergeTargetId,
  }) {
    try {
      const result = await setDisposition({
        db: agentDb(),
        disposition,
        dispositionRationale,
        mergeTargetId,
        requestId,
      });
      return result;
    } catch (error) {
      if (error instanceof DispositionError)
        return { error: `${error.code}: ${error.message}` };
      throw error;
    }
  },
  inputSchema: z.object({
    disposition: z.enum(["merge", "monitor", "decline", "needs_discussion"]),
    dispositionRationale: z.string().min(1),
    mergeTargetId: z.string().uuid().optional(),
    requestId: z.string().uuid(),
  }),
});
