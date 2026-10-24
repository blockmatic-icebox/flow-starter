export const PARENT_OWNED_WRITE_PATTERNS = [
  /^docs\/initiatives\//u,
  /^\.agents\/flow\/initiatives\//u,
  /^pnpm-lock\.yaml$/u,
  /^skills-lock\.json$/u,
  /knowledge-snapshot\.ts$/u,
];

export const DB_SCHEMA_PREFIX = "packages/db/";

export const isParentOwnedWrite = (writePath) =>
  PARENT_OWNED_WRITE_PATTERNS.some((pattern) => pattern.test(writePath));

export const isDbSchemaPath = (writePath) =>
  writePath === "packages/db" ||
  writePath.startsWith("packages/db/") ||
  writePath.startsWith(`${DB_SCHEMA_PREFIX}`);
