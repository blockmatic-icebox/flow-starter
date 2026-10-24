import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyStagedPaths,
  parseNulPaths,
  stagedChecks,
} from "./check-staged.mjs";

test("parses NUL-delimited paths, including spaces and newlines", () => {
  const encoded = Buffer.from("docs/my file.md\0src/odd\nname.ts\0", "utf-8");
  assert.deepEqual(parseNulPaths(encoded), [
    "docs/my file.md",
    "src/odd\nname.ts",
  ]);
});

test("classifies staged files without dropping unusual names", () => {
  const groups = classifyStagedPaths([
    "docs/my file.md",
    "apps/web/lib/security/read json.ts",
    "apps/web/package.json",
    ".gitleaks.toml",
    "README.md",
  ]);
  assert.deepEqual(groups.markdown, ["docs/my file.md", "README.md"]);
  assert.deepEqual(groups.code, ["apps/web/lib/security/read json.ts"]);
  assert.deepEqual(groups.manifests, ["apps/web/package.json"]);
  assert.deepEqual(groups.security, [".gitleaks.toml"]);
});

test("selects lightweight checks and skips the full suite", () => {
  const markdown = stagedChecks(["docs/readme.md"]).map((check) =>
    check.args.join(" ")
  );
  assert.match(markdown.join("\n"), /check-flow-docs/u);
  assert.equal(
    markdown.some((command) => command.includes("playwright")),
    false
  );

  const code = stagedChecks(["apps/web/lib/security/read-json-request.ts"]);
  assert.equal(
    code.some((check) => check.args.includes("oxlint")),
    true
  );
  assert.equal(
    code.some((check) => check.args.includes("build")),
    false
  );

  const security = stagedChecks(["scripts/scan-secrets-staged.mjs"]);
  assert.equal(
    security.some((check) => check.args.includes("--test")),
    true
  );
});
