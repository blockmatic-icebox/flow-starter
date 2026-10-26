import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { GET as getCatchAllSlug } from "../app/[...slug]/route";

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

const getMarkdownNotFound = (pathname: string) => {
  const slug = pathname.replace(/^\//u, "").split("/").filter(Boolean);
  const request = new Request(`http://meta-cto.localhost${pathname}`, {
    headers: { Accept: "text/markdown" },
  });
  return getCatchAllSlug(request, { params: Promise.resolve({ slug }) });
};

test("unknown path with Accept text/markdown returns markdown 404 and llms.txt link", async () => {
  const response = await getMarkdownNotFound("/no-such-agent-path");
  assert.equal(response.status, 404);
  assert.equal(
    response.headers.get("content-type"),
    "text/markdown; charset=utf-8"
  );
  assert.equal(response.headers.get("vary"), "Accept");
  const body = await response.text();
  assert.match(body, /llms\.txt/u);
  assert.ok(body.length >= 20);
});

test("known-prefix unknown subpath does not use catch-all markdown 404", async () => {
  await assert.rejects(() => getMarkdownNotFound("/api/no-such-mcp-route"));
});

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
