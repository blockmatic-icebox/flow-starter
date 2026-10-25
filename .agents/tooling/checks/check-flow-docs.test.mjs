import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { repoRoot as repositoryRoot } from "../lib/repo-paths.mjs";
import { validateFlowDocs } from "./check-flow-docs.mjs";

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

const firstPartySkillIds = ["flow", "flow-eval", "flow-improve"];

const requiredDocuments = {
  ".agents/flow/README.md": "# Flow\n",
  ".agents/flow/architecture.md": "# Factory architecture\n",
  ".agents/flow/factory.md": "# Foundation\n",
  ".agents/flow/flow.md": "# Contract\n",
  "AGENTS.md": "# Agents\n",
  "ARCHITECTURE.md": "# Architecture\n",
};

function firstPartySkillFixture(skillId) {
  return `---
name: ${skillId}
description: fixture
---

# ${skillId}
`;
}

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

  for (const skillId of firstPartySkillIds) {
    const skillFile = path.join(root, ".agents/skills", skillId, "SKILL.md");
    if (!existsSync(skillFile)) {
      mkdirSync(path.dirname(skillFile), { recursive: true });
      writeFileSync(skillFile, firstPartySkillFixture(skillId), "utf-8");
    }
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

test("flow-improve and flow-eval disable model invocation; flow does not", () => {
  const root = path.resolve(import.meta.dirname, "..", "..", "..");
  const flow = readFileSync(
    path.join(root, ".agents/skills/flow/SKILL.md"),
    "utf-8"
  );
  const improve = readFileSync(
    path.join(root, ".agents/skills/flow-improve/SKILL.md"),
    "utf-8"
  );
  const evalSkill = readFileSync(
    path.join(root, ".agents/skills/flow-eval/SKILL.md"),
    "utf-8"
  );
  assert.match(improve, /^disable-model-invocation:\s*true/mu);
  assert.match(evalSkill, /^disable-model-invocation:\s*true/mu);
  assert.doesNotMatch(flow, /^disable-model-invocation:/mu);
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

test("flags adopted readme missing product identity", (t) => {
  const root = fixture(
    t,
    ["README.md", "PRODUCT.md", "DESIGN.md", ".agents/package.json"],
    {
      ".agents/package.json": JSON.stringify({
        scripts: {
          "test:tooling": "node --test tooling/setup/prompt-log.test.mjs",
        },
      }),
      "DESIGN.md": "# Design\n\n## Experience direction\n\nok\n",
      "PRODUCT.md": "# My App\n\nScope.\n",
      "README.md": "# My App\n\nGeneric readme.\n",
    },
    { omitRequired: true }
  );
  const readmeErrors = validateFlowDocs(root).filter((e) =>
    e.startsWith("README.md:")
  );
  assert.ok(
    readmeErrors.some((e) =>
      /web application built with Flow Factory/iu.test(e)
    ),
    readmeErrors.join("\n")
  );
});

test("flow.md retains progressive disclosure anchors", () => {
  const flowMd = readFileSync(
    path.join(repositoryRoot, ".agents/flow/flow.md"),
    "utf-8"
  );
  assert.match(flowMd, /## Where detail lives/u);
  assert.match(flowMd, /## Documentation ownership/u);
  assert.match(flowMd, /### Proportionality and continuation/u);
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
