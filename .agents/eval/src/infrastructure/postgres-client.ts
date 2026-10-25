import postgres from "postgres";

const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1"]);

const resolveSsl = ({ url }: { url: string }) => {
  try {
    const parsed = new URL(url.replace(/^postgres:/u, "postgresql:"));
    const insecure =
      process.env.NODE_ENV !== "production" &&
      process.env.DATABASE_TLS_INSECURE_LOCAL === "1" &&
      loopbackHosts.has(parsed.hostname);
    if (insecure) return { rejectUnauthorized: false as const };
    return "require" as const;
  } catch {
    return "require" as const;
  }
};

export const connectPostgres = ({ url }: { url: string }) =>
  postgres(url, {
    connect_timeout: 30,
    idle_timeout: 20,
    max: 1,
    ssl: resolveSsl({ url }),
  });

export const pingDatabase = async ({
  sql,
}: {
  sql: ReturnType<typeof connectPostgres>;
}) => {
  const [row] = await sql`select 1 as ok`;
  if (String(row?.ok) !== "1") throw new Error("unexpected ping result");
};
