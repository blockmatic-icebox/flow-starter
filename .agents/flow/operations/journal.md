# Development journal

Canonical authority for **task closeout reporting** (user-visible) and **persistent journaling** (coordinator-only). Git remains implementation history.

Every completed repository task produces a **Task report** in the Cursor conversation. Not every task produces a new document.

Coordinator reconciliation and worker returns: [delegation.md](delegation.md). **Skills loaded** footer: [skills.md](skills.md) (must be the final section).

## Roles

| Artifact | Role |
| --- | --- |
| Task report (this page) | User-visible closeout after every repository task |
| `.agents/flow/prompts.txt` | Optional **local** prompt log (gitignored; never commit) |
| `.agents/flow/records/*.md` | Initiative retrospectives and evidence index |
| `PRODUCT.md` / `DESIGN.md` / `ARCHITECTURE.md` | Current product contracts |
| ADRs / PDRs | Consequential decisions (product and Factory namespaces) |

## Document ownership (reporting)

Categorize documentation changes in the Task report and prompt log:

| Category | Paths |
| --- | --- |
| Product contracts | `PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md` |
| Product decisions | `docs/adr/`, `docs/pdr/` — include **Status** (`Proposed`, `Accepted`, etc.) when applicable |
| Product research | `docs/research/` |
| Product initiatives and specs | `docs/initiatives/`, `docs/specs/`, `docs/plans/` when present |
| Factory operations and methodology | `.agents/flow/operations/` |
| Factory decisions | `.agents/flow/decisions/adr/`, `.agents/flow/decisions/pdr/` |
| Factory research, initiatives, specs | `.agents/flow/research/`, `.agents/flow/initiatives/`, `.agents/flow/specs/` |

Do not create ADRs, research files, or initiatives solely to satisfy reporting. Reading a document is not a change—report only created, updated, removed, or superseded paths.

## Task report (user-visible)

Display in the main Cursor conversation after every repository task (Explore, Specify, Plan, Build, Review, Ship, Flow improvement, evaluation, setup-only). Applies even when the Flow skill was not loaded.

**Core principle:** concise, evidence-based, truthful. Never invent verification, commits, or documentation changes.

### Required sections

Use the heading **`Task report`** with status and stage on the same line, for example: **`Task report`** — Completed · Build

1. **Status** — `Completed`, `Partial`, or `Blocked`, plus current Flow stage or activity.
2. **Outcome** — One or two sentences on the meaningful result. For research or planning, state the finding or decision; do not imply code shipped unless it did.
3. **Documentation** — Exact repository-relative paths with a short explanation per meaningful change. Group by ownership (product, Factory, ADR/PDR, research, initiatives/specs). Include decision status when applicable. If nothing changed: `No documentation changes`.
4. **Code** — Concise summary by capability or significant paths. If none: `None`.
5. **Verification** — Commands actually run and outcomes; include exit codes when available. Separate passed, failed, blocked, and not-run. Distinguish automated checks, browser verification, and human/product validation.
6. **Git** — Commit SHA and subject when created (`git log` / `git rev-parse`). GitHub link only when repository URL and commit are known. Distinguish local-only vs published. If no commit: `Not committed`. Never commit only to supply a link.
7. **Delegation** — When workers ran: brief outcomes, material failures, unresolved findings. Omit when solo.
8. **Next** — One recommended next step, blocker, or approval when relevant. Omit when work is fully done with no follow-up.

Then end with **Skills loaded** per [skills.md](skills.md) (always last).

### Proportionality

| Task size | Guidance |
| --- | --- |
| Small | ~5–10 short lines; merge empty categories instead of many `None` lines |
| Medium | Meaningful doc paths, code summary, verification, Git |
| Substantial | Brief executive summary and links to initiatives/records; delegate detail to the owning artifact or prompt log |

Do not truncate blockers, failed checks, security findings, or decision statuses for brevity. Use markdown links to real files when helpful; do not invent URLs.

### Read-only or blocked persistence

When the environment cannot write files (for example plan-only mode), still deliver the Task report in chat. State that the prompt log entry was not appended.

### Illustrative examples (not execution evidence)

**Implemented feature**

**Task report** — Completed · Build

Implemented property search with URL-based filters and added regression coverage.

**Documentation**

- `PRODUCT.md` — Updated: search behavior and acceptance criteria.
- `DESIGN.md` — Updated: filters and responsive interaction.
- `docs/adr/0002-search-state.md` — Created: Accepted decision on URL state.
- `docs/research/20261025-search.md` — Created: supporting evidence.

**Code** — Updated property search route and filter logic; added regression tests.

**Verification** — `pnpm test` — passed, exit 0. Browser verification — not run.

**Git** — `abc1234` — `feat: add property search` (illustrative local commit).

**Next** — Verify mobile interactions in the browser.

**Research-only**

**Task report** — Completed · Explore

Compared three search approaches and recommended URL-based state. No implementation performed.

**Documentation** — `DESIGN.md` updated (proposed interaction); `docs/research/20261025-search.md` created. ADR/PDR — none.

**Code** — None.

**Verification** — Research review only; no automated tests run.

**Git** — Not committed.

**Next** — Approval of the proposed direction.

## Prompt log entry (coordinator only)

Prompt logs are **local-only** (listed in `.gitignore`). Do **not** commit `.agents/flow/prompts.txt` or root `prompts.txt`.

Preference, opt-in on first post-install task, and paths: [prompt-log.md](prompt-log.md).

When logging is **enabled** in `AGENTS.md` (or required by an employer brief), the coordinator appends **one** block per handled request. Otherwise use the Task report only. Workers and subagents must never append.

### Prompt log Q/A format

Default block shape. Log **questions and answers**; do not copy multiple-choice **options** into **Q:**.

```text
---
Timestamp: <ISO-8601>
Work: <initiative slug or short id>
Stage: <Explore|Specify|Plan|Build|Review|Ship|setup|eval|flow-improve>

Human: <redacted human intent>

Agent: <concise outcome>

Q: <next question to the human, no option lists>

---
```

Use **A:** when the human message answers the previous **Q:** (see [prompt-log.md](prompt-log.md)).

### Prompt log extended format (optional)

When an employer brief asks for richer metadata, add these fields after the Q/A lines in the same block:

```text
---
Timestamp: <ISO-8601>
Work: <initiative slug or short id>
Stage: <Explore|Specify|Plan|Build|Review|Ship|setup|eval|flow-improve>
Prompt: <redacted human intent>

Outcome: <Completed|Partial|Blocked> — <one-line outcome>

Summary:
- <concise task summary>

Documentation (product):
- <path> [created|updated|removed|superseded|unchanged] — <short note>
- PRODUCT.md / DESIGN.md / ARCHITECTURE.md as applicable

Documentation (Factory):
- <path> [created|updated|removed|superseded|unchanged] — <short note>

Decisions:
- <path> — <Proposed|Accepted|Deprecated|Superseded> — <short note>
- or "none"

Research:
- <path> — <short note> or "none"

Initiatives / specifications:
- <path> — <short note> or "none"

Code:
- <capability or module summary> or "none"

Subagents:
- <worker id / role>: <status> — <concise outcome> or "none"

Verification:
- <command> — <passed|failed|blocked|not run>, exit <code> when known>
- or "not applicable"

Commits:
- <sha> — <subject> (local|published) or "none"

Limitations / next:
- <blockers, approvals, follow-up> or "none"

Record:
- <optional .agents/flow/records/<slug>.md or other detailed record>
---
```

Redact secrets before writing (Bearer tokens, private keys, JWTs, env assignments with `TOKEN`, `SECRET`, `PASSWORD`, `API_KEY`).

### Journaling rules

1. Only the coordinator appends journal entries.
2. Never allow parallel subagents to append to the same journal.
3. Preserve chronological order and historical entries; do not rewrite earlier records.
4. Record actual execution, not intended execution.
5. Redact credentials, secrets, personal information, and unnecessary private context.
6. Use actual timestamps; never manufacture them.
7. One logical entry per handled human task—not per worker or tool call.
8. Avoid duplicate entries when a request spans multiple internal stages.
9. In read-only environments, deliver the Task report; state when persistence was skipped.
10. Follow Git integration so journal writes do not modify another worker's branch unexpectedly.
11. Report commits only when Git confirms they exist.
12. Do not duplicate the full Git diff or conversation transcript in the log.

The journal should answer: what was asked, what changed, which documents were touched, what was decided, what code was delivered, what was verified, which commit contains the work, and what remains unresolved.

## When to update contracts

- **DESIGN.md** — During Explore when visual references, interaction direction, or experience constraints emerge. User journeys are optional.
- **PRODUCT.md** — When objectives, scope, requirements, or acceptance criteria change.
- **ARCHITECTURE.md** — When boundaries, integrations, or implemented architecture materially change.

Update only when there is new information; do not fill templates for ceremony.
