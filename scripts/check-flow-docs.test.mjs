import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validateFlowDocs } from "./check-flow-docs.mjs";

function defaultMarkdownContent(relative) {
  if (relative.startsWith("docs/research/")) {
    const dated = /^(?<date>\d{8})-/u.exec(path.basename(relative));
    const researchDate = dated
      ? `${dated.groups.date.slice(0, 4)}-${dated.groups.date.slice(4, 6)}-${dated.groups.date.slice(6, 8)}`
      : "2026-10-20";

    return `# Research\n\n**Research date:** ${researchDate}\n**Last reviewed:** 2026-10-24\n**Status:** Current\n`;
  }

  if (relative.startsWith("docs/specs/")) {
    return `# Spec\n\n**Last reviewed:** 2026-10-24\n**Status:** Current\n`;
  }

  if (
    relative.startsWith("docs/adr/") ||
    relative.startsWith("docs/pdr/")
  ) {
    return "Date: 2026-10-24\n\n# Decision\n";
  }

  return "# Example\n";
}

function fixture(t, filenames, contents = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), "flow-docs-"));

  t.after(() => {
    rmSync(root, { force: true, recursive: true });
  });

  for (const filename of filenames) {
    const absolute = path.join(root, filename);

    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(
      absolute,
      contents[filename] ?? defaultMarkdownContent(filename),
      "utf-8"
    );
  }

  return root;
}

test("allows absent optional directories", (t) => {
  const root = fixture(t, []);
  assert.deepEqual(validateFlowDocs(root), []);
});

test("accepts canonical filenames", (t) => {
  const root = fixture(t, [
    "docs/ideas/customer-problem.md",
    "docs/initiatives/onboarding.md",
    "docs/plans/database-migration.md",
    "docs/specs/authentication.md",
    "docs/research/20261024-user-interviews.md",
    "docs/adr/0007-auth-boundary.md",
    "docs/pdr/0001-pricing-model.md",
  ]);

  assert.deepEqual(validateFlowDocs(root), []);
});

test("preserves explicit legacy nested GenUI spec documents", (t) => {
  const root = fixture(t, [
    "docs/specs/genui/README.md",
    "docs/specs/genui/INVENTORY.md",
  ]);

  assert.deepEqual(validateFlowDocs(root), []);
});

test("accepts foundational ADR 0001 filename", (t) => {
  const root = fixture(t, ["docs/adr/0001-agentic-architecture.md"]);

  assert.deepEqual(validateFlowDocs(root), []);
});

test("rejects retired three-digit ADR 001 path", (t) => {
  const root = fixture(t, ["docs/adr/001-use-flow-starter.md"]);

  assert.match(validateFlowDocs(root).join("\n"), /invalid filename/u);
});

test("rejects uppercase decision prefixes", (t) => {
  const root = fixture(t, ["docs/adr/ADR-new-decision.md"]);

  assert.match(validateFlowDocs(root).join("\n"), /invalid filename/u);
});

test("rejects new three-digit ADRs", (t) => {
  const root = fixture(t, ["docs/adr/007-new-decision.md"]);

  assert.match(validateFlowDocs(root).join("\n"), /invalid filename/u);
});

test("allows ADR 0001 and ADR 0008 to coexist", (t) => {
  const root = fixture(t, [
    "docs/adr/0001-agentic-architecture.md",
    "docs/adr/0008-monorepo-turborepo-pnpm.md",
  ]);

  assert.deepEqual(validateFlowDocs(root), []);
});

test("detects duplicate modern ADR numbers", (t) => {
  const root = fixture(t, [
    "docs/adr/0007-first-decision.md",
    "docs/adr/0007-second-decision.md",
  ]);

  assert.match(validateFlowDocs(root).join("\n"), /duplicate ADR number/u);
});

test("does not share identifiers across ADRs and PDRs", (t) => {
  const root = fixture(t, [
    "docs/adr/0001-technical-boundary.md",
    "docs/pdr/0001-product-boundary.md",
  ]);

  assert.deepEqual(validateFlowDocs(root), []);
});

test("rejects nested new specifications", (t) => {
  const root = fixture(t, ["docs/specs/auth/requirements.md"]);

  assert.match(validateFlowDocs(root).join("\n"), /nested Markdown/u);
});

test("rejects uppercase Markdown extensions", (t) => {
  const root = fixture(t, ["docs/ideas/new-feature.MD"]);

  assert.match(validateFlowDocs(root).join("\n"), /invalid filename/u);
});

test("rejects invalid calendar dates", (t) => {
  const root = fixture(t, ["docs/research/20260229-not-real.md"]);

  assert.match(validateFlowDocs(root).join("\n"), /invalid ISO calendar date/u);
});

test("accepts valid leap days", (t) => {
  const root = fixture(t, ["docs/research/20280229-valid-leap-day.md"]);

  assert.deepEqual(validateFlowDocs(root), []);
});

test("rejects decision identifier zero", (t) => {
  const root = fixture(t, ["docs/adr/0000-not-a-decision.md"]);

  assert.match(
    validateFlowDocs(root).join("\n"),
    /invalid decision identifier/u
  );
});

test("rejects research missing metadata", (t) => {
  const root = fixture(t, ["docs/research/20261024-missing-meta.md"], {
    "docs/research/20261024-missing-meta.md": "# Research\n",
  });

  assert.match(
    validateFlowDocs(root).join("\n"),
    /missing \*\*Research date:\*\*/u
  );
});

test("rejects research with invalid review date", (t) => {
  const root = fixture(t, ["docs/research/20261024-bad-review.md"], {
    "docs/research/20261024-bad-review.md":
      "# Research\n\n**Research date:** 2026-10-24\n**Last reviewed:** 2026-02-30\n**Status:** Current\n",
  });

  assert.match(
    validateFlowDocs(root).join("\n"),
    /invalid \*\*Last reviewed:\*\*/u
  );
});

test("rejects research filename and metadata date mismatch", (t) => {
  const root = fixture(t, ["docs/research/20261024-mismatch.md"], {
    "docs/research/20261024-mismatch.md":
      "# Research\n\n**Research date:** 2026-10-20\n**Last reviewed:** 2026-10-24\n**Status:** Current\n",
  });

  assert.match(validateFlowDocs(root).join("\n"), /must match filename date/u);
});

test("rejects ADR missing Date header", (t) => {
  const root = fixture(t, ["docs/adr/0002-example.md"], {
    "docs/adr/0002-example.md": "# ADR\n",
  });

  assert.match(validateFlowDocs(root).join("\n"), /missing Date:/u);
});

test("rejects spec missing review metadata", (t) => {
  const root = fixture(t, ["docs/specs/auth.md"], {
    "docs/specs/auth.md": "# Spec\n\n**Status:** Current\n",
  });

  assert.match(
    validateFlowDocs(root).join("\n"),
    /missing \*\*Last reviewed:\*\*/u
  );
});

test("rejects spec missing status", (t) => {
  const root = fixture(t, ["docs/specs/auth.md"], {
    "docs/specs/auth.md": "# Spec\n\n**Last reviewed:** 2026-10-24\n",
  });

  assert.match(
    validateFlowDocs(root).join("\n"),
    /missing or invalid \*\*Status:\*\*/u
  );
});

test("validates historical nested GenUI spec metadata", (t) => {
  const root = fixture(t, ["docs/specs/genui/INVENTORY.md"], {
    "docs/specs/genui/INVENTORY.md":
      "# Inventory\n\n**Last reviewed:** 2026-10-24\n**Status:** Historical\n",
  });

  assert.deepEqual(validateFlowDocs(root), []);
});
