import path from "node:path";
import { pathToFileURL } from "node:url";

import { repoRoot as repositoryRoot } from "../lib/repo-paths.mjs";

export function validateTaskReporting(_root = repositoryRoot) {
  return [];
}

const entrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : null;

if (import.meta.url === entrypoint) {
  console.log("Task reporting conventions: OK (optional; no enforced checks)");
}
