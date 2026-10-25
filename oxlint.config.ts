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
      files: ["packages/db/src/auth-schema.ts"],
      rules: {
        "eslint/no-inline-comments": "off",
        "eslint/sort-keys": "off",
      },
    },
    {
      files: ["packages/genui/src/orchestration/stream.ts"],
      rules: {
        "eslint/no-await-in-loop": "off",
      },
    },
    {
      files: [".agents/eval/**/*.ts"],
      rules: {
        "eslint/no-nested-ternary": "off",
        "eslint/prefer-destructuring": "off",
        "eslint/sort-keys": "off",
        "typescript/consistent-type-definitions": "off",
        "unicorn/no-lonely-if": "off",
        "unicorn/no-useless-undefined": "off",
        "unicorn/text-encoding-identifier-case": "off",
      },
    },
    {
      files: [".agents/tooling/**/*.mjs"],
      rules: {
        "eslint/no-await-in-loop": "off",
        "eslint/prefer-destructuring": "off",
        "eslint/prefer-named-capture-group": "off",
        "eslint/require-unicode-regexp": "off",
        "promise/prefer-await-to-callbacks": "off",
        "promise/prefer-await-to-then": "off",
        "unicorn/import-style": "off",
        "unicorn/no-await-expression-member": "off",
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
