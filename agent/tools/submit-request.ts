import { createDraftAndTriage, getDb } from "@repo/fi";
import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Create a draft feature request and run the AI triage harness. Returns pending_confirm preview only—call confirm_request after user approval.",
  async execute({ title, description, source }) {
    const { harness, request } = await createDraftAndTriage({
      db: getDb(),
      description,
      source,
      title,
    });
    return {
      harness,
      request,
      status: "pending_confirm",
    };
  },
  inputSchema: z.object({
    description: z.string().min(1).max(8000),
    source: z.enum(["customer", "prospect", "support", "internal"]),
    title: z.string().min(1).max(500),
  }),
});
