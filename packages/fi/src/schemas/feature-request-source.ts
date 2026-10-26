import { z } from "zod";

export const featureRequestSourceSchema = z.enum([
  "customer",
  "prospect",
  "support",
  "internal",
]);

export type FeatureRequestSource = z.infer<typeof featureRequestSourceSchema>;
