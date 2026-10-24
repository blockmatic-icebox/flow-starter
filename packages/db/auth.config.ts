import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const url =
  process.env.DATABASE_URL ??
  "postgres://neon:npg@127.0.0.1:5432/neondb?sslmode=disable";

const client = postgres(url, { max: 1 });
const db = drizzle(client);

/** CLI-only config for schema generation — no runtime auth server in the starter. */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
});
