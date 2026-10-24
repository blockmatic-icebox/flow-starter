import { MAX_QUERY_CODE_POINTS } from "@repo/genui";
import { z } from "zod";

const codePointLength = (value: string) => [...value].length;

export const composeRequestSchema = z.strictObject({
  clientRequestId: z
    .string()
    .regex(/^[\w.:-]{1,128}$/u)
    .optional(),
  query: z
    .string()
    .trim()
    .min(1)
    .refine((value) => codePointLength(value) <= MAX_QUERY_CODE_POINTS, {
      message: "query_too_long",
    }),
  version: z.literal(1).optional(),
});

export type ComposeRequest = z.infer<typeof composeRequestSchema>;

export const composeRequestErrorMessage = (error: z.ZodError) => {
  const query = error.issues.find((issue) => issue.path[0] === "query");
  if (query?.message === "query_too_long") return "Query is too long.";
  if (query?.code === "too_small") return "Query is required.";
  if (query) return "Query must be a string.";
  if (error.issues.some((issue) => issue.path[0] === "clientRequestId"))
    return "Invalid client request id.";
  if (error.issues.some((issue) => issue.path[0] === "version"))
    return "Unsupported protocol version.";
  return "Invalid request.";
};
