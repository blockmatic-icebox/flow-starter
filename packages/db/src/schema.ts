import { pgTable, text } from "drizzle-orm/pg-core";

export const appMeta = pgTable("app_meta", {
  id: text("id").primaryKey(),
  value: text("value").notNull(),
});
