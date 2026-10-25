import { pgTable, text } from "drizzle-orm/pg-core";

export { account, session, user, verification } from "./auth-schema.js";
export {
  featureRequest,
  featureRequestDispositionEnum,
  featureRequestDuplicateCandidate,
  featureRequestSourceEnum,
  featureRequestStatusEnum,
  featureRequestSupport,
} from "./fi-schema.js";

export const appMeta = pgTable("app_meta", {
  id: text("id").primaryKey(),
  value: text("value").notNull(),
});
