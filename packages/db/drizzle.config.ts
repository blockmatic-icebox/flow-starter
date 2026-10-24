import { defineConfig } from "drizzle-kit";

const url =
  process.env.DATABASE_URL ??
  "postgres://neon:npg@localhost:5432/neondb?sslmode=require";

export default defineConfig({
  dbCredentials: { url },
  dialect: "postgresql",
  out: "./migrations",
  schema: "./src/schema.ts",
});
