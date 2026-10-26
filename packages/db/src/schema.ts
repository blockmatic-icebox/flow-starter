import { pgTable, text } from "drizzle-orm/pg-core";

export { account, session, user, verification } from "./auth-schema";

export const appMeta = pgTable("app_meta", {
  id: text("id").primaryKey(),
  value: text("value").notNull(),
});
