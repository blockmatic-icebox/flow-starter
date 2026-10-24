export function renderBrief({ slug, task, initiativeRelative, baseSha }) {
  return `# Worktree brief: ${task.id}

## Context

- Initiative slug: ${slug}
- Initiative: \`${initiativeRelative}\`
- Wave: ${task.wave}
- Task id: ${task.id}
- Flow stage: ${task.flow_stage}
- Mode: ${task.mode}
- Base revision: \`${baseSha}\`

## Writes (only these paths)

${task.writes.length ? task.writes.map((p) => `- ${p}`).join("\n") : "- (none — read only)"}

## Reads

${task.reads.map((p) => `- ${p}`).join("\n")}

## Skills (load SKILL.md for each)

${task.skills.map((s) => `- ${s}`).join("\n")}

## Acceptance

${task.mode === "build" ? `\`${task.acceptance}\` must exit 0.` : "Return findings to the parent; do not edit canonical docs."}

## Return to parent

1. Summary of results
2. Files changed (if any)
3. Commands run with exit codes
4. Blockers
5. Open questions
6. Risks and recommended next action
7. Skills whose SKILL.md was actually loaded
`;
}
