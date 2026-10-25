import { createDb } from "@repo/db";
import type { AppDatabase } from "@repo/db";

export const getDb = (): AppDatabase => {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is required");
  return createDb({ url }).db;
};
