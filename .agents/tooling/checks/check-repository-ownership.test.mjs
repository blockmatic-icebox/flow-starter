import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { validateRepositoryOwnership } from "./check-repository-ownership.mjs";

test("allows clean product layout", () => {
  const root = mkdtempSync(join(tmpdir(), "ownership-ok-"));
  mkdirSync(join(root, "apps/web/app"), { recursive: true });
  mkdirSync(join(root, ".agents/eval"), { recursive: true });
  writeFileSync(
    join(root, "apps/web/app/page.tsx"),
    "export default function Page() { return <main>Product starter</main>; }"
  );
  assert.deepEqual(validateRepositoryOwnership(root), []);
  rmSync(root, { force: true, recursive: true });
});

test("rejects factory eval under packages and flow app", () => {
  const root = mkdtempSync(join(tmpdir(), "ownership-bad-"));
  mkdirSync(join(root, "apps/flow"), { recursive: true });
  mkdirSync(join(root, "packages/flow-eval"), { recursive: true });
  const errors = validateRepositoryOwnership(root);
  assert.ok(errors.some((e) => e.includes("apps/flow")));
  assert.ok(errors.some((e) => e.includes("packages/flow-eval")));
  rmSync(root, { force: true, recursive: true });
});

test("rejects product imports from Factory", () => {
  const root = mkdtempSync(join(tmpdir(), "ownership-import-"));
  mkdirSync(join(root, "apps/web/app"), { recursive: true });
  writeFileSync(
    join(root, "apps/web/app/bad.ts"),
    'import x from ".agents/eval/src/cli.ts"'
  );
  const errors = validateRepositoryOwnership(root);
  assert.ok(errors.some((e) => e.includes("must not import Factory")));
  rmSync(root, { force: true, recursive: true });
});
