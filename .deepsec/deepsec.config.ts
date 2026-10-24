import { defineConfig } from "deepsec/config";

import { generatedMatchersPlugin } from "./generated-matchers.js";

export default defineConfig({
  ai: { mode: "gateway", provider: "vercel" },
  defaultAgent: "pi",
  defaultModel: "xai/grok-4.6",
  defaultThinkingLevel: "medium",
  projects: [
    {
      id: "flow",
      root: "..",
      priorityPaths: ["apps/web", "packages/ui"],
    },
    // <deepsec:projects-insert-above>
  ],
  plugins: [generatedMatchersPlugin],
});
