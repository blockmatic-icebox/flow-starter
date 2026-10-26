import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.join(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf-8"));
const help = readFileSync(path.join(root, "bin/fi.mjs"), "utf-8");

test("feature-intelligence-cli exposes fi bin", () => {
  assert.equal(pkg.name, "feature-intelligence-cli");
  assert.ok(pkg.bin?.fi);
  assert.equal(pkg.private, undefined);
});

test("fi.mjs documents npm install", () => {
  assert.match(help, /feature-intelligence-cli/u);
});
