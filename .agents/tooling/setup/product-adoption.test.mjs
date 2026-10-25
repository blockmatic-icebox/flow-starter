import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { repoRoot } from "../lib/repo-paths.mjs";
import {
  applyProductAdoption,
  isReservedPortlessName,
  slugify,
  validateProjectName,
} from "./product-adoption.mjs";

const copyAdoptionFixture = (root) => {
  const paths = [
    "apps",
    "package.json",
    "README.md",
    "PRODUCT.md",
    "DESIGN.md",
    "ARCHITECTURE.md",
    ".agents/package.json",
  ];
  for (const relative of paths)
    cpSync(join(repoRoot, relative), join(root, relative), { recursive: true });
  const setupDir = join(root, ".agents/tooling/setup");
  mkdirSync(setupDir, { recursive: true });
  cpSync(
    join(repoRoot, ".agents/tooling/setup/product-readme.template.md"),
    join(setupDir, "product-readme.template.md")
  );
};

test("slugify and portless reserved names", () => {
  assert.equal(slugify("Acme Widgets"), "acme-widgets");
  assert.equal(isReservedPortlessName("run"), true);
  assert.equal(isReservedPortlessName("eval-s13"), false);
});

test("validateProjectName rejects control characters", () => {
  assert.throws(
    () => validateProjectName("bad\u0001name"),
    /control characters/u
  );
});

test("apply sets package name portless host and product readme", () => {
  const root = mkdtempSync(join(tmpdir(), "flow-adoption-apply-"));
  copyAdoptionFixture(root);

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

  const readme = readFileSync(join(root, "README.md"), "utf-8");
  assert.match(readme, /^# Eval S13 r1\n/u);
  assert.match(readme, /Web application built with Flow Factory/u);

  const design = readFileSync(join(root, "DESIGN.md"), "utf-8");
  assert.match(design, /Experience direction/u);

  rmSync(root, { force: true, recursive: true });
});
