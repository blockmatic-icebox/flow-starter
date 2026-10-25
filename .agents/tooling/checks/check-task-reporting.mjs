import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { repoRoot as repositoryRoot } from "../lib/repo-paths.mjs";

const journalRel = ".agents/flow/operations/journal.md";
const agentsRel = "AGENTS.md";
const flowSkillRel = ".agents/skills/flow/SKILL.md";
const skillsRel = ".agents/flow/operations/skills.md";
const delegationRel = ".agents/flow/operations/delegation.md";

const workerAdapterRels = [
  ".agents/agents/researcher.md",
  ".agents/agents/builder.md",
  ".agents/agents/verifier.md",
];

const requiredJournalPhrases = [
  "Task report",
  "Completed",
  "Partial",
  "Blocked",
  "No documentation changes",
  "Not committed",
  "Prompt log entry (coordinator only)",
  "Only the coordinator appends journal entries",
];

function read(root, relative) {
  const absolute = path.join(root, relative);
  if (!existsSync(absolute)) return { content: "", missing: true };
  return { content: readFileSync(absolute, "utf-8"), missing: false };
}

function validateJournal(journal) {
  const errors = [];
  if (journal.missing) {
    errors.push(`missing canonical reporting document ${journalRel}`);
    return errors;
  }
  for (const phrase of requiredJournalPhrases) {
    if (!journal.content.includes(phrase))
      errors.push(`${journalRel}: missing required phrase "${phrase}"`);
  }
  return errors;
}

function validateAgents(agents) {
  const errors = [];
  if (agents.missing) return [`missing ${agentsRel}`];
  if (!/Task report/iu.test(agents.content))
    errors.push(`${agentsRel}: must require Task report closeout`);
  if (!agents.content.includes("operations/journal.md"))
    errors.push(`${agentsRel}: must link to operations/journal.md`);
  if (!/Skills loaded/iu.test(agents.content))
    errors.push(`${agentsRel}: must require Skills loaded footer`);
  return errors;
}

function validateFlowSkill(flowSkill) {
  const errors = [];
  if (flowSkill.missing) return [`missing ${flowSkillRel}`];
  if (!/Task report/iu.test(flowSkill.content))
    errors.push(`${flowSkillRel}: must reference Task report closeout`);
  if (/Documentation impact/iu.test(flowSkill.content))
    errors.push(
      `${flowSkillRel}: must not require standalone Documentation impact closeout`
    );
  return errors;
}

function validateSkillsPage(skills) {
  const errors = [];
  if (skills.missing) return [`missing ${skillsRel}`];
  if (!skills.content.includes("**Skills loaded**"))
    errors.push(`${skillsRel}: missing **Skills loaded** footer block`);
  if (!/footer.*final|final section/iu.test(skills.content))
    errors.push(`${skillsRel}: must state Skills loaded footer is final`);
  if (!/Task report/iu.test(skills.content))
    errors.push(`${skillsRel}: must relate Task report to Skills loaded`);
  return errors;
}

function validateDelegationPage(delegation) {
  const errors = [];
  if (delegation.missing) return [`missing ${delegationRel}`];
  if (!/Worker result contract/iu.test(delegation.content))
    errors.push(`${delegationRel}: missing Worker result contract`);
  if (
    !/journal\.md.*Task report|Task report.*journal\.md/iu.test(
      delegation.content
    )
  )
    errors.push(
      `${delegationRel}: coordinator closeout must reference journal Task report`
    );
  return errors;
}

function validateWorkerAdapters(root) {
  const errors = [];
  for (const relative of workerAdapterRels) {
    const file = read(root, relative);
    if (file.missing) {
      errors.push(`missing worker adapter ${relative}`);
      continue;
    }
    if (!/Worker result contract/iu.test(file.content))
      errors.push(`${relative}: must reference Worker result contract`);
    if (!/prompts\.txt/iu.test(file.content))
      errors.push(`${relative}: must forbid prompts.txt writes`);
  }
  return errors;
}

export function validateTaskReporting(root = repositoryRoot) {
  const journal = read(root, journalRel);
  const journalErrors = validateJournal(journal);
  if (journal.missing) return journalErrors;

  return [
    ...journalErrors,
    ...validateAgents(read(root, agentsRel)),
    ...validateFlowSkill(read(root, flowSkillRel)),
    ...validateSkillsPage(read(root, skillsRel)),
    ...validateDelegationPage(read(root, delegationRel)),
    ...validateWorkerAdapters(root),
  ];
}

const entrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : null;

if (import.meta.url === entrypoint) {
  const errors = validateTaskReporting();

  if (errors.length > 0) {
    console.error("Task reporting validation failed:\n");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log("Task reporting conventions: OK");
  }
}
