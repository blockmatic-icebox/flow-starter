const LOCAL_PROXY =
  /\/\/(?:[^/@]+@)?(?:localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/u;

export const defaultAdminDatabaseUrl = () =>
  "postgres://neon:npg@localhost:5432/neondb?sslmode=require";

export const buildSubjectDatabaseUrl = ({
  databaseName,
}: {
  databaseName: string;
}) =>
  `postgres://neon:npg@localhost:5432/${encodeURIComponent(databaseName)}?sslmode=require`;

export const databaseNameFromUrl = (url: string) => {
  try {
    const parsed = new URL(url.replace(/^postgres:/u, "postgresql:"));
    const name = parsed.pathname.replace(/^\//u, "").split("/")[0];
    return decodeURIComponent(name ?? "");
  } catch {
    return "";
  }
};

export const assertSubjectDatabaseUrl = ({
  databaseName,
  url,
}: {
  databaseName: string;
  url: string;
}) => {
  if (!url.trim())
    throw new Error(
      "subject database URL is required for database-dependent eval"
    );
  if (!LOCAL_PROXY.test(url))
    throw new Error("subject database URL must target the local Neon proxy");
  const fromUrl = databaseNameFromUrl(url);
  if (fromUrl !== databaseName)
    throw new Error(
      `subject database URL targets "${fromUrl}" but expected "${databaseName}"`
    );
  if (fromUrl === "neondb")
    throw new Error("subject must not use the default neondb database");
};

export const redactDatabaseUrl = (url: string) => {
  try {
    const parsed = new URL(url.replace(/^postgres:/u, "postgresql:"));
    const db = databaseNameFromUrl(url);
    return `postgres://***@${parsed.hostname}:${parsed.port || "5432"}/${db}?***`;
  } catch {
    return "postgres://***";
  }
};
