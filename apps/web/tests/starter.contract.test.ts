import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.join(import.meta.dirname, "..");
const appRoot = path.join(root, "app");

const listSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry);
    if (statSync(absolute).isDirectory()) {
      files.push(...listSourceFiles(absolute));
      continue;
    }
    if (/\.(?:ts|tsx)$/u.test(entry)) files.push(absolute);
  }
  return files;
};

test("product app does not import Factory or reference removed Flow app", () => {
  const forbidden = /(?:from\s+["']\.agents|apps\/flow|dev:flow)/u;
  for (const file of listSourceFiles(appRoot)) {
    const content = readFileSync(file, "utf-8");
    assert.equal(
      forbidden.test(content),
      false,
      `${path.relative(root, file)} must stay product-only`
    );
  }
});
