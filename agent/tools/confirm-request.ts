import { ConfirmRequestError, confirmRequest } from "@repo/fi";
import { defineTool } from "eve/tools";
import { z } from "zod";

import { agentDb } from "../lib/db";

export default defineTool({
  description:
    "Publish a draft request after the user confirms or edits the problem statement.",
  async execute({ requestId, problemStatement, intakeLinkedRequestId }) {
    try {
      const published = await confirmRequest({
        db: agentDb(),
        intakeLinkedRequestId,
        problemStatement,
        requestId,
      });
      return { request: published };
    } catch (error) {
      if (error instanceof ConfirmRequestError)
        return { error: `${error.code}: ${error.message}` };
      throw error;
    }
  },
  inputSchema: z.object({
    intakeLinkedRequestId: z.string().uuid().nullable().optional(),
    problemStatement: z.string().min(1).max(4000),
    requestId: z.string().uuid(),
  }),
});
