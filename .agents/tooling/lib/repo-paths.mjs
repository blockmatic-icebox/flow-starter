import path from "node:path";

/** `.agents/` — Flow Factory root */
export const agentsRoot = path.resolve(import.meta.dirname, "..", "..");

/** Repository root (parent of `.agents/`) */
export const repoRoot = path.resolve(agentsRoot, "..");

/** `.agents/tooling/` */
export const toolingRoot = path.resolve(import.meta.dirname, "..");
