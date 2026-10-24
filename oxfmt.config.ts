import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  ignorePatterns: [
    ...(ultracite.ignorePatterns ?? []),
    ".deepsec/**",
    "apps/flow/app/_lib/flow-agent/knowledge-snapshot.ts",
  ],
});
