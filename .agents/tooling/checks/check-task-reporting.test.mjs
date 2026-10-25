import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validateTaskReporting } from "./check-task-reporting.mjs";

test("validateTaskReporting passes on factory checkout", () => {
  const errors = validateTaskReporting();
  assert.equal(errors.length, 0, errors.join("\n"));
});

test("validateTaskReporting flags missing journal phrases", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "flow-task-report-"));
  mkdirSync(path.join(root, ".agents/agents"), { recursive: true });
  mkdirSync(path.join(root, ".agents/skills/flow"), { recursive: true });
  mkdirSync(path.join(root, ".agents/flow/operations"), { recursive: true });

  writeFileSync(
    path.join(root, ".agents/flow/operations/journal.md"),
    "# Development journal\n",
    "utf-8"
  );
  writeFileSync(
    path.join(root, "AGENTS.md"),
    "Task report operations/journal.md Skills loaded\n",
    "utf-8"
  );
  writeFileSync(
    path.join(root, ".agents/skills/flow/SKILL.md"),
    "Task report\n",
    "utf-8"
  );
  writeFileSync(
    path.join(root, ".agents/flow/operations/skills.md"),
    "**Skills loaded**\nTask report\nfinal section\n",
    "utf-8"
  );
  writeFileSync(
    path.join(root, ".agents/flow/operations/delegation.md"),
    "Worker result contract journal.md Task report\n",
    "utf-8"
  );
  for (const name of ["researcher", "builder", "verifier"]) {
    writeFileSync(
      path.join(root, `.agents/agents/${name}.md`),
      "Worker result contract prompts.txt\n",
      "utf-8"
    );
  }

  const errors = validateTaskReporting(root);
  assert.ok(errors.length > 0);
  assert.ok(
    errors.some(
      (e) => e.includes("journal.md") && e.includes("missing required")
    )
  );

  rmSync(root, { force: true, recursive: true });
});
