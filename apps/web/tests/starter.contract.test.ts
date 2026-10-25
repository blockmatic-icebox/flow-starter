import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.join(import.meta.dirname, "..");

test("product starter homepage copy", () => {
  const page = readFileSync(path.join(root, "app/page.tsx"), "utf-8");
  assert.match(page, /Product starter/u);
  assert.doesNotMatch(page, /Feature Intelligence/u);
});

test("generic application metadata", () => {
  const layout = readFileSync(path.join(root, "app/layout.tsx"), "utf-8");
  assert.match(layout, /title:\s*"Product"/u);
  assert.match(layout, /Product starter — replace PRODUCT\.md and DESIGN\.md/u);
});
