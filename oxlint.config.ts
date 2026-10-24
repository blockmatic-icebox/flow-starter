import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";

export default defineConfig({
  extends: [core, react, next],
  ignorePatterns: [
    ...core.ignorePatterns,
    ".deepsec/**",
    "packages/ui/src/components/**",
  ],
  overrides: [
    {
      files: ["packages/ui/src/hooks/use-mobile.ts"],
      rules: {
        "react/set-state-in-effect": "off",
      },
    },
    {
      files: ["apps/web/hooks/use-highlighted-code.ts"],
      rules: {
        "eslint/no-empty-function": "off",
        "promise/prefer-await-to-then": "off",
      },
    },
  ],
  rules: {
    curly: "off",
    "eslint/no-use-before-define": "off",
    "func-style": "off",
    "no-alert": "off",
    "react/function-component-definition": "off",
  },
});
