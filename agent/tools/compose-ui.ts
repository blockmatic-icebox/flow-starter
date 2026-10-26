import { composeQuery, MAX_QUERY_CODE_POINTS } from "@repo/genui";
import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Generate a validated OpenUI composition from a natural-language UI request (synthetic demo data).",
  async execute({ query }) {
    const clientRequestId = `eve-${Date.now()}`;
    const result = await composeQuery({
      input: { clientRequestId, query, version: 1 },
    });
    const complete = result.events.find((e) => e.type === "complete");
    if (!complete || complete.type !== "complete")
      return {
        error: "composition_failed",
        validationOk: result.metadata.validationOk,
      };
    return {
      envelope: complete.envelope,
      metadata: result.metadata,
    };
  },
  inputSchema: z.object({
    query: z.string().min(1).max(MAX_QUERY_CODE_POINTS),
  }),
});
