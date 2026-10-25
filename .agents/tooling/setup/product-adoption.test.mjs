import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { repoRoot } from "../lib/repo-paths.mjs";
import {
  applyProductAdoption,
  isReservedPortlessName,
  slugify,
} from "./product-adoption.mjs";

test("slugify and portless reserved names", () => {
  assert.equal(slugify("Acme Widgets"), "acme-widgets");
  assert.equal(isReservedPortlessName("run"), true);
  assert.equal(isReservedPortlessName("eval-s13"), false);
});

test("apply sets package name and portless host like install", () => {
  const root = mkdtempSync(join(tmpdir(), "flow-adoption-apply-"));
  cpSync(join(repoRoot, "apps"), join(root, "apps"), { recursive: true });
  cpSync(join(repoRoot, "package.json"), join(root, "package.json"));
  cpSync(join(repoRoot, "README.md"), join(root, "README.md"));

  const { host, slug } = applyProductAdoption({
    projectName: "Eval S13 r1",
    root,
  });
  assert.equal(slug, "eval-s13-r1");
  assert.equal(host, "eval-s13-r1.localhost");

  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
  const webPkg = JSON.parse(
    readFileSync(join(root, "apps/web/package.json"), "utf-8")
  );
  assert.equal(pkg.name, "eval-s13-r1");
  assert.equal(webPkg.portless.name, "eval-s13-r1");
  assert.match(
    readFileSync(join(root, "apps/web/next.config.ts"), "utf-8"),
    /eval-s13-r1\.localhost/u
  );

  rmSync(root, { force: true, recursive: true });
});
