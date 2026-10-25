# Development journal

Factory-owned chronicle of human intent and outcomes. Git remains implementation history.

## Roles

| Artifact | Role |
| --- | --- |
| `.agents/flow/prompts.txt` | Chronological prompt log (parent agent only) |
| `.agents/flow/records/*.md` | Initiative retrospectives and evidence index |
| `PRODUCT.md` / `DESIGN.md` / `ARCHITECTURE.md` | Current product contracts |
| ADRs / PDRs | Accepted decisions |

## Prompt log entry (coordinator only)

Append after integrating delegated work. Never fabricate timestamps, commits, subagent work, or verification.

```text
---
Timestamp: <ISO-8601>
Work: <initiative slug or short id>
Stage: <Explore|Specify|Plan|Build|Review|Ship>
Prompt: <redacted human prompt>

Summary:
- <concise actions>

Documentation:
- DESIGN.md [created|updated|unchanged]
  - <bullet changes>
- PRODUCT.md [created|updated|unchanged]
  - <bullet changes>
- ARCHITECTURE.md [created|updated|unchanged]
  - <bullet changes>
- docs/ <paths> [created|updated|removed|unchanged]

Factory docs:
- <paths and summary, when applicable>

Decisions:
- <proposed or accepted, with status when unclear>

Features:
- <delivered capabilities or "none">

Subagents:
- <role>: <structured outcome>

Verification:
- <commands, exit codes, or "not applicable">

Commits:
- <sha> — <subject> or "none"

Record:
- .agents/flow/records/<slug>.md
```

Redact secrets before writing (Bearer tokens, private keys, JWTs, env assignments with `TOKEN`, `SECRET`, `PASSWORD`, `API_KEY`).

## When to update contracts

- **DESIGN.md** — During Explore when visual references, interaction direction, or experience constraints emerge. User journeys are optional.
- **PRODUCT.md** — When objectives, scope, requirements, or acceptance criteria change.
- **ARCHITECTURE.md** — When boundaries, integrations, or implemented architecture materially change.

Update only when there is new information; do not fill templates for ceremony.
