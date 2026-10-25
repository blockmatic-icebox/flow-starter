import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.join(import.meta.dirname, "..");

test("homepage identifies Feature Intelligence", () => {
  const page = readFileSync(path.join(root, "app/page.tsx"), "utf-8");
  assert.match(page, /Feature Intelligence/u);
  assert.match(page, /feature-intelligence initiative/u);
  assert.doesNotMatch(page, /Replace PRODUCT\.md/u);
});

test("product application metadata", () => {
  const layout = readFileSync(path.join(root, "app/layout.tsx"), "utf-8");
  assert.match(layout, /title:\s*"Feature Intelligence"/u);
  assert.doesNotMatch(layout, /replace PRODUCT\.md/u);
});
