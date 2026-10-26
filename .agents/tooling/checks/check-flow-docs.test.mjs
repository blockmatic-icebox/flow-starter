import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  validateFlowDocs,
  validateSeparatedProductTasks,
} from "./check-flow-docs.mjs";

function defaultMarkdownContent(relative) {
  if (relative.startsWith("docs/research/")) {
    const dated = /^(?<date>\d{8})-/u.exec(path.basename(relative));
    const researchDate = dated
      ? `${dated.groups.date.slice(0, 4)}-${dated.groups.date.slice(4, 6)}-${dated.groups.date.slice(6, 8)}`
      : "2026-10-20";

    return `# Research\n\n**Research date:** ${researchDate}\n**Last reviewed:** 2026-10-24\n**Status:** Current\n`;
  }

  if (
    relative.startsWith("docs/specs/") ||
    relative.startsWith(".agents/flow/specs/")
  ) {
    return `# Spec\n\n**Last reviewed:** 2026-10-24\n**Status:** Current\n`;
  }

  if (
    relative.startsWith("docs/decisions/") ||
    relative.startsWith("docs/adr/") ||
    relative.startsWith("docs/pdr/") ||
    relative.startsWith(".agents/flow/decisions/adr/") ||
    relative.startsWith(".agents/flow/decisions/pdr/")
  ) {
    return `Date: 2026-10-24

# Decision

**Status:** Accepted

## Context

Example context.

## Decision

Example decision.

## Alternatives considered

None for fixture.

## Consequences

Example consequences.

## Related documents

None.
`;
  }

  return "# Example\n";
}

const requiredDocuments = {
  ".agents/flow/README.md": "# Flow\n",
  ".agents/flow/architecture.md": "# Factory architecture\n",
  ".agents/flow/factory.md": "# Foundation\n",
  ".agents/flow/flow.md": "# Contract\n",
  "AGENTS.md": "# Agents\n",
  "ARCHITECTURE.md": "# Architecture\n",
};

function fixture(t, filenames, contents = {}, options = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), "flow-docs-"));

  t.after(() => {
    rmSync(root, { force: true, recursive: true });
  });

  const names = new Set(filenames);
  if (!options.omitRequired) {
    for (const filename of Object.keys(requiredDocuments)) names.add(filename);
  }

  for (const filename of names) {
    const absolute = path.join(root, filename);

    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(
      absolute,
      contents[filename] ??
        requiredDocuments[filename] ??
        defaultMarkdownContent(filename),
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

test("rejects nested GenUI spec paths after migration", (t) => {
  const root = fixture(t, ["docs/specs/genui/readme.md"]);

  assert.match(validateFlowDocs(root).join("\n"), /nested Markdown/u);
});

test("accepts foundational ADR 0001 filename", (t) => {
  const root = fixture(t, [
    ".agents/flow/decisions/adr/0001-agentic-architecture.md",
  ]);

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
    ".agents/flow/decisions/adr/0001-agentic-architecture.md",
    ".agents/flow/decisions/adr/0008-monorepo-turborepo-pnpm.md",
  ]);

  assert.deepEqual(validateFlowDocs(root), []);
});

test("detects duplicate modern ADR numbers", (t) => {
  const root = fixture(t, [
    "docs/adr/0007-first-decision.md",
    "docs/adr/0007-second-decision.md",
  ]);

  assert.match(
    validateFlowDocs(root).join("\n"),
    /duplicate product-adr number/u
  );
});

test("allows Factory ADR 0001 and product ADR 0001 to coexist", (t) => {
  const root = fixture(t, [
    ".agents/flow/decisions/adr/0001-agentic-architecture.md",
    "docs/adr/0001-use-flow-factory.md",
  ]);

  assert.deepEqual(validateFlowDocs(root), []);
});

test("detects duplicate Factory ADR numbers", (t) => {
  const root = fixture(t, [
    ".agents/flow/decisions/adr/0001-first.md",
    ".agents/flow/decisions/adr/0001-second.md",
  ]);

  assert.match(
    validateFlowDocs(root).join("\n"),
    /duplicate factory-adr number/u
  );
});

test("rejects migrated Factory ADR under docs/adr", (t) => {
  const root = fixture(t, ["docs/adr/0001-agentic-architecture.md"]);

  assert.match(validateFlowDocs(root).join("\n"), /Factory ADR belongs under/u);
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

test("requires canonical documents", (t) => {
  const root = fixture(t, [], {}, { omitRequired: true });
  assert.match(
    validateFlowDocs(root).join("\n"),
    /missing canonical document AGENTS.md/u
  );
});

test("reports a broken relative link with its source file", (t) => {
  const root = fixture(t, ["docs/ideas/customer-problem.md"], {
    "docs/ideas/customer-problem.md": `${defaultMarkdownContent("docs/ideas/customer-problem.md")}\n[Missing](./missing.md)\n`,
  });
  assert.match(
    validateFlowDocs(root).join("\n"),
    /docs\/ideas\/customer-problem.md: broken link \.\/missing.md/u
  );
});

test("accepts relative, encoded, directory, and fragment links", (t) => {
  const root = fixture(
    t,
    ["docs/my file.md", "docs/ideas/customer-problem.md"],
    {
      "docs/ideas/customer-problem.md": `${defaultMarkdownContent("docs/ideas/customer-problem.md")}
[Architecture](../../ARCHITECTURE.md)
[Encoded](../my%20file.md)
[Workflow](../../.agents/flow/)
[Fragment](../../.agents/flow/flow.md#review)
[External](https://example.com/docs)
[Mail](mailto:security@example.invalid)
`,
      "docs/my file.md": "# Notes\n",
    }
  );
  assert.deepEqual(validateFlowDocs(root), []);
});

test("ignores links inside fenced code", (t) => {
  const root = fixture(t, ["docs/ideas/customer-problem.md"], {
    "docs/ideas/customer-problem.md": `${defaultMarkdownContent("docs/ideas/customer-problem.md")}
\`\`\`md
[Missing](./missing.md)
\`\`\`
`,
  });
  assert.deepEqual(validateFlowDocs(root), []);
});

test("validates current repository product contracts and readme identity", () => {
  const errors = validateFlowDocs();
  assert.equal(errors.length, 0, errors.join("\n"));
});

test("flags placeholder markers in product contracts", (t) => {
  const root = fixture(t, ["PRODUCT.md", "DESIGN.md", "README.md"], {
    "DESIGN.md": "# Design\n\nok\n",
    "PRODUCT.md": "# Product\n\nnot initialized\n",
    "README.md": "# Flow Factory\n\n",
  });
  assert.match(
    validateFlowDocs(root).join("\n"),
    /PRODUCT\.md: contains placeholder marker/u
  );
});

test("flags adopted readme with placeholder project name heading", (t) => {
  const root = fixture(
    t,
    [
      "README.md",
      "PRODUCT.md",
      "DESIGN.md",
      ".agents/package.json",
      "packages/ui/src/styles/globals.css",
    ],
    {
      ".agents/package.json": JSON.stringify({
        scripts: {
          "test:tooling": "node --test tooling/setup/prompt-log.test.mjs",
        },
      }),
      "DESIGN.md": "# Design\n\n## Experience direction\n\nok\n",
      "PRODUCT.md": "# My App\n\nScope.\n",
      "README.md": "# Project Name\n\nGeneric readme.\n",
      "packages/ui/src/styles/globals.css": ":root { --background: ok; }\n",
    },
    { omitRequired: true }
  );
  const readmeErrors = validateFlowDocs(root).filter((e) =>
    e.startsWith("README.md:")
  );
  assert.ok(
    readmeErrors.some((e) => /Project Name/iu.test(e)),
    readmeErrors.join("\n")
  );
});

test("requires separated docs/tasks checklist for initiatives with ## Tasks", (t) => {
  const root = fixture(
    t,
    ["docs/initiatives/demo.md", "docs/tasks/demo.md", "docs/specs/demo.md"],
    {
      "docs/initiatives/demo.md": `# Demo

## Tasks (execution)

See [tasks](../tasks/demo.md).
`,
      "docs/specs/demo.md":
        "# Spec\n\n**Last reviewed:** 2026-10-24\n**Status:** Current\n",
      "docs/tasks/demo.md": "# Tasks\n\n- [ ] T-0-1\n",
    },
    { omitRequired: true }
  );
  assert.equal(validateSeparatedProductTasks(root).length, 0);
});

test("flags embedded T-*-* tables in initiatives and specs", (t) => {
  const root = fixture(
    t,
    ["docs/initiatives/bad.md", "docs/specs/bad.md"],
    {
      "docs/initiatives/bad.md": `# Bad

## Tasks

| **T-0-1** | migrate |
`,
      "docs/specs/bad.md":
        "# Spec\n\n**Last reviewed:** 2026-10-24\n**Status:** Current\n\n| **T-1-1** | x |\n",
    },
    { omitRequired: true }
  );
  const errors = validateSeparatedProductTasks(root);
  assert.ok(
    errors.some((e) => e.includes("docs/initiatives/bad.md")),
    errors.join("\n")
  );
  assert.ok(
    errors.some((e) => e.includes("docs/specs/bad.md")),
    errors.join("\n")
  );
});

test("flags obsolete apps/web security paths in authoritative docs", (t) => {
  const root = fixture(t, [".agents/flow/specs/genui.md", "apps/flow/.keep"], {
    ".agents/flow/specs/genui.md":
      "# Spec\n\n**Last reviewed:** 2026-10-24\n**Status:** Current\n\napps/web/lib/security/foo\n",
    "apps/flow/.keep": "",
  });

  assert.match(
    validateFlowDocs(root).join("\n"),
    /obsolete path reference.*apps\/web\/lib\/security/u
  );
});

test("accepts unified decisions and upstream skill configuration", (t) => {
  const root = fixture(t, [
    "docs/decisions/0001-user-outcome.md",
    "docs/decisions/0002-runtime-boundary.md",
    "docs/agents/domain.md",
    "docs/agents/issue-tracker.md",
  ]);
  assert.deepEqual(validateFlowDocs(root), []);
});

test("validates unified decision metadata and duplicate numbers", (t) => {
  const root = fixture(
    t,
    ["docs/decisions/0001-product.md", "docs/decisions/0001-technical.md"],
    { "docs/decisions/0001-product.md": "# Missing metadata\n" }
  );
  const errors = validateFlowDocs(root).join("\n");
  assert.match(errors, /duplicate product-adr number 0001/u);
  assert.match(errors, /docs\/decisions\/0001-product.md:.*Date/u);
});

test("skill configuration exception does not permit a parallel methodology", (t) => {
  const root = fixture(t, ["docs/agents/new-workflow.md"]);
  assert.match(
    validateFlowDocs(root).join("\n"),
    /methodology document must live/u
  );
});
