import { confirmRequest, getDb } from "@repo/fi";
import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Publish a draft request after the user confirms or edits the problem statement.",
  async execute({ requestId, problemStatement, intakeLinkedRequestId }) {
    const published = await confirmRequest({
      db: getDb(),
      intakeLinkedRequestId,
      problemStatement,
      requestId,
    });
    return { request: published };
  },
  inputSchema: z.object({
    intakeLinkedRequestId: z.string().uuid().nullable().optional(),
    problemStatement: z.string().min(1).max(4000),
    requestId: z.string().uuid(),
  }),
});
