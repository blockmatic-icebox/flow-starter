# Local prompt log

Gitignored conversation trail for assessments, audits, and collaboration review. **Never commit** `prompts.txt` or `.agents/flow/prompts.txt`.

Task closeout in chat still uses the [Task report](journal.md#task-report-user-visible).

## Preference (post-install)

On the **first handled repository task** after Flow Factory install (or when neither opt-in nor decline is recorded):

1. End the response with one question (no option lists in the log question itself): **Enable local Q/A prompt logging to gitignored `prompts.txt`?**
2. **Yes** — add the [AGENTS.md enabled block](#agentsmd-enabled-block) to the repo agent entrypoint (`AGENTS.md` at the repository root, or `CLAUDE.md` / `.cursor/rules` when that file is the primary agent router for the checkout).
3. **No** — create `.agents/flow/local/prompt-log.declined` (gitignored) with one line: `declined: <ISO-8601>`. Do not ask again.

**Already decided:** Skip the question when `AGENTS.md` (or equivalent) contains `## Local prompt log (enabled)`, or when `prompt-log.declined` exists.

**Employer brief:** When a brief requires a prompt trail, reconcile with [journal.md](journal.md) and [flow.md](../flow.md#starting-from-an-existing-brief). Prefer gitignored local files; never commit logs. Brief path wins over decline, but conflicts (for example “commit prompts.txt”) still require a human decision.

## When to append

| Condition | Append Q/A block |
| --- | --- |
| `## Local prompt log (enabled)` in agent entrypoint | **Required** after every handled human request |
| Employer brief requires local trail | **Required** (use brief path if specified) |
| Declined and no brief requirement | **Do not** append |
| Unset preference | **Do not** append until enabled; ask on first task |

Coordinator only. Workers and subagents never append.

**Default path:** repository-root `prompts.txt`. Use `.agents/flow/prompts.txt` only when the brief or enabled block says so.

## Q/A format

One block per handled human request. Log **questions and answers**, not multiple-choice option lists in **Q:**.

```text
---
Timestamp: <ISO-8601>
Work: <initiative slug or short id>
Stage: <Explore|Specify|Plan|Build|Review|Ship|setup|eval|flow-improve>

Human: <human message intent, redacted>

Agent: <concise outcome of this turn>

Q: <next question to the human, single line, no A/B/C options>

---
```

When the human’s message answers the prior **Q:**, start the block with **A:** on its own line before **Human:** or merge into **Human:** as “A: …”.

Redact secrets (tokens, keys, env secrets) before writing.

Do not erase or rewrite earlier entries. Do not fabricate timestamps, commits, subagent work, or verification.

## AGENTS.md enabled block

Paste under the Flow section when the human opts in:

```markdown
## Local prompt log (enabled)

The coordinator **must** append one Q/A block per handled human request to gitignored repository-root `prompts.txt`. Format: [.agents/flow/operations/journal.md](.agents/flow/operations/journal.md#prompt-log-qa-format). Log **questions and answers** only—do not paste multiple-choice option lists into **Q:**. Never commit `prompts.txt`. Workers and subagents do not append.
```

## Extended journal block (optional)

For employer submissions that require richer metadata, append optional fields from [journal.md — Prompt log entry](journal.md#prompt-log-entry-coordinator-only) after the Q/A lines in the same block.
