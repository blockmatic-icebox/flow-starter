import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validateReactArchitecture } from "./check-react-architecture.mjs";

function write(root, relative, content) {
  const absolute = path.join(root, relative);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, content, "utf-8");
}

function fixture(t, files) {
  const root = mkdtempSync(path.join(os.tmpdir(), "flow-arch-"));

  t.after(() => {
    rmSync(root, { force: true, recursive: true });
  });

  for (const [relative, content] of Object.entries(files)) {
    write(root, relative, content);
  }

  return root;
}

function basePackages() {
  return {
    "apps/web/app/layout.tsx": `import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html><body><ThemeProvider>{children}</ThemeProvider></body></html>;
}
`,
    "apps/web/package.json": JSON.stringify({
      dependencies: { "@repo/genui": "workspace:*", "@repo/ui": "workspace:*" },
      name: "web",
    }),
    "packages/genui/package.json": JSON.stringify({
      dependencies: {},
      name: "@repo/genui",
    }),
    "packages/ui/package.json": JSON.stringify({
      dependencies: {},
      name: "@repo/ui",
    }),
  };
}

test("allows valid app-to-package imports", (t) => {
  const root = fixture(t, {
    ...basePackages(),
    "apps/web/app/page.tsx": `import { Button } from "@repo/ui/components/button";
import { GenuiRenderer } from "@repo/genui/react";
export default function Page() { return <Button /><GenuiRenderer />; }
`,
    "packages/genui/src/react/index.ts": `export const GenuiRenderer = () => null;`,
    "packages/ui/src/components/button.tsx": `export const Button = () => <button />;`,
  });

  assert.deepEqual(validateReactArchitecture(root), []);
});

test("allows valid package-internal imports", (t) => {
  const root = fixture(t, {
    ...basePackages(),
    "packages/ui/src/lib/cn.ts": `export const cn = (...parts: string[]) => parts.join(" ");`,
    "packages/ui/src/lib/utils.ts": `import { cn } from "./cn";
export const util = () => cn("a");
`,
  });

  assert.deepEqual(validateReactArchitecture(root), []);
});

test("rejects UI importing application alias", (t) => {
  const root = fixture(t, {
    ...basePackages(),
    "packages/ui/src/components/bad.tsx": `import { x } from "@/lib/x";
export const Bad = () => null;
`,
  });

  assert.match(
    validateReactArchitecture(root)
      .map((v) => v.rule)
      .join(","),
    /shared-ui-no-app-imports/u
  );
});

test("rejects UI importing GenUI", (t) => {
  const root = fixture(t, {
    ...basePackages(),
    "packages/ui/src/components/bad.tsx": `import { x } from "@repo/genui";
export const Bad = () => null;
`,
  });

  assert.match(
    validateReactArchitecture(root)
      .map((v) => v.rule)
      .join(","),
    /shared-ui-no-genui/u
  );
});

test("rejects GenUI importing application code", (t) => {
  const root = fixture(t, {
    ...basePackages(),
    "packages/genui/src/react/bad.tsx": `import { x } from "@/lib/x";
export const Bad = () => null;
`,
  });

  assert.match(
    validateReactArchitecture(root)
      .map((v) => v.rule)
      .join(","),
    /genui-no-app-imports/u
  );
});

test("rejects deep package source imports", (t) => {
  const root = fixture(t, {
    ...basePackages(),
    "apps/web/app/page.tsx": `import { x } from "@repo/ui/src/lib/utils";
export default function Page() { return null; }
`,
  });

  assert.match(
    validateReactArchitecture(root)
      .map((v) => v.rule)
      .join(","),
    /no-deep-package-imports/u
  );
});

test("rejects client root layout", (t) => {
  const root = fixture(t, {
    ...basePackages(),
    "apps/web/app/layout.tsx": `"use client";
export default function RootLayout() { return null; }
`,
  });

  assert.match(
    validateReactArchitecture(root)
      .map((v) => v.rule)
      .join(","),
    /server-first-root-layout/u
  );
});

test("allows nested client component", (t) => {
  const root = fixture(t, {
    ...basePackages(),
    "apps/web/app/page.tsx": `import { Client } from "@/components/client";
export default function Page() { return <Client />; }
`,
    "apps/web/components/client.tsx": `"use client";
export const Client = () => null;
`,
  });

  assert.deepEqual(validateReactArchitecture(root), []);
});

test("rejects circular workspace dependency", (t) => {
  const root = fixture(t, {
    "apps/web/app/layout.tsx": basePackages()["apps/web/app/layout.tsx"],
    "apps/web/package.json": JSON.stringify({
      dependencies: {},
      name: "web",
    }),
    "packages/genui/package.json": JSON.stringify({
      dependencies: { "@repo/ui": "workspace:*" },
      name: "@repo/genui",
    }),
    "packages/ui/package.json": JSON.stringify({
      dependencies: { "@repo/genui": "workspace:*" },
      name: "@repo/ui",
    }),
  });

  assert.match(
    validateReactArchitecture(root)
      .map((v) => v.rule)
      .join(","),
    /workspace-dependency-cycle/u
  );
});

test("allows valid package dependency graph", (t) => {
  const root = fixture(t, {
    "apps/web/app/layout.tsx": basePackages()["apps/web/app/layout.tsx"],
    "apps/web/package.json": JSON.stringify({
      dependencies: {
        "@repo/genui": "workspace:*",
        "@repo/ui": "workspace:*",
      },
      name: "web",
    }),
    "packages/genui/package.json": JSON.stringify({
      dependencies: { "@repo/ui": "workspace:*" },
      name: "@repo/genui",
    }),
    "packages/ui/package.json": JSON.stringify({
      dependencies: {},
      name: "@repo/ui",
    }),
  });

  assert.deepEqual(validateReactArchitecture(root), []);
});

test("allows generated shared UI component imports", (t) => {
  const root = fixture(t, {
    ...basePackages(),
    "packages/ui/src/components/ui/card.tsx": `import { cn } from "@repo/ui/lib/utils";
export const Card = () => <div className={cn("card")} />;
`,
    "packages/ui/src/lib/utils.ts": `export const cn = (...parts: string[]) => parts.join(" ");`,
  });

  assert.deepEqual(validateReactArchitecture(root), []);
});

test("allows type-only imports from forbidden paths in UI", (t) => {
  const root = fixture(t, {
    ...basePackages(),
    "packages/ui/src/components/typed.tsx": `import type { CompositionEnvelope } from "@repo/genui";
export const Typed = (_: CompositionEnvelope) => null;
`,
  });

  const rules = validateReactArchitecture(root).map((v) => v.rule);
  assert.equal(rules.includes("shared-ui-no-genui"), false);
});

test("rejects client imports of server security helpers", (t) => {
  const root = fixture(t, {
    ...basePackages(),
    "apps/web/app/demo/client.tsx": `"use client";
import { readJsonRequest } from "@/lib/security/read-json-request";
export const Demo = () => readJsonRequest;
`,
  });

  assert.match(
    validateReactArchitecture(root)
      .map((violation) => violation.rule)
      .join(","),
    /client-no-server-security/u
  );
});

test("rejects cross-application imports", (t) => {
  const root = fixture(t, {
    ...basePackages(),
    "apps/flow/app/page.tsx": `import { x } from "web/lib/x";
export default function Page() { return null; }
`,
    "apps/flow/package.json": JSON.stringify({
      dependencies: { "@repo/genui": "workspace:*", "@repo/ui": "workspace:*" },
      name: "flow-app",
    }),
  });

  assert.match(
    validateReactArchitecture(root)
      .map((v) => v.rule)
      .join(","),
    /no-cross-app-imports/u
  );
});

test("detects static dynamic imports", (t) => {
  const root = fixture(t, {
    ...basePackages(),
    "apps/web/app/page.tsx": `const load = () => import("@repo/genui/src/react/index");
export default function Page() { void load(); return null; }
`,
  });

  assert.match(
    validateReactArchitecture(root)
      .map((v) => v.rule)
      .join(","),
    /no-deep-package-imports/u
  );
});
