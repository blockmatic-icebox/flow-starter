const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/u;
const GLOB_CHARS = /[*?[\]]/u;

export const validateSlug = (slug) => {
  if (!SLUG_PATTERN.test(slug)) return `invalid slug: ${slug}`;
  return null;
};

export const validateTaskId = (id) => {
  if (!SLUG_PATTERN.test(id)) return `invalid task id: ${id}`;
  return null;
};

export const normalizeRepoPath = (raw) => {
  const trimmed = raw.trim().replaceAll("\\", "/");
  if (!trimmed) return { error: "empty path" };
  if (trimmed.startsWith("/") || /^[A-Za-z]:/u.test(trimmed))
    return { error: `absolute path not allowed: ${raw}` };
  if (trimmed.includes("\0")) return { error: "NUL in path" };
  if (GLOB_CHARS.test(trimmed))
    return { error: `glob characters not allowed: ${raw}` };
  const segments = trimmed.split("/").filter(Boolean);
  if (segments.some((s) => s === ".."))
    return { error: `path traversal not allowed: ${raw}` };
  const normalized = segments.join("/");
  return { path: normalized };
};

export const normalizePathKey = (p) => p.replace(/\/$/u, "");

export const pathsOverlap = (a, b) => {
  const na = normalizePathKey(a);
  const nb = normalizePathKey(b);
  if (na === nb) return true;
  const prefixA = `${na}/`;
  const prefixB = `${nb}/`;
  return na.startsWith(prefixB) || nb.startsWith(prefixA);
};

export const pathOwnedBy = ({ path: filePath, writes }) => {
  const normalized = normalizePathKey(filePath);
  for (const write of writes) {
    const nw = normalizePathKey(write);
    if (normalized === nw) return true;
    if (normalized.startsWith(`${nw}/`)) return true;
  }
  return false;
};

export const parseInlineList = (rest) => {
  const inner = rest.trim();
  if (!inner.startsWith("[") || !inner.endsWith("]"))
    return { error: "expected bracket list" };
  const body = inner.slice(1, -1).trim();
  if (!body) return { items: [] };
  const items = body
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const item of items) {
    const parsed = normalizeRepoPath(item);
    if (parsed.error) return { error: parsed.error };
  }
  return { items };
};
