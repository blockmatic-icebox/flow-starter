# Flow migration baseline

**Research date:** 2026-10-24

**Last reviewed:** 2026-10-24

**Status:** Historical

Captured before consolidating Flow under `.agents/flow/`. Live activation matrix runs are **missing** when agent CLI auth is blocked (`__dev/flow-evals/cli-auth-blocker.json`).

## Deterministic command results

| Command | Exit code |
| --- | --: |
| `pnpm flow:check` | 0 |
| `pnpm flow:test` | 0 |
| `pnpm --dir .agents flow-eval:check` | 0 |
| `pnpm architecture:check` | 0 |
| `pnpm --filter flow-app check-types` | 1 (pre-existing TS errors in `chat-tools.ts`, `deterministic-stream.ts`) |

## Instruction sizes (pre-migration)

| File                                    | Lines | Bytes |
| --------------------------------------- | ----: | ----: |
| `AGENTS.md` (full)                      |    65 |  6694 |
| `AGENTS.md` (excluding Turborepo block) |    56 |  5335 |
| `.agents/flow/flow.md`                  |   408 | 24343 |
| `.agents/flow/operations/skills.md`     |    93 |  5916 |

## Flow Agent knowledge allowlist (pre-migration)

- `.agents/flow/flow.md`
- `.agents/flow/README.md`
- `.agents/flow/factory.md`
- `.agents/flow/architecture.md`
- `ARCHITECTURE.md`
- `AGENTS.md`
- `.agents/flow/operations/context.md`
- `.agents/flow/operations/verification.md`
- `.agents/flow/operations/skills.md`
- `.agents/flow/operations/worktrees.md`
- `PRODUCT.md`

## Delegation policy routing baseline (`skillsIncludes`)

| Scenario | Skills |
| --- | --- |
| D01, D08, D09 | `idea-refine` |
| D02 | `spec-driven-development` |
| D03 | `test-driven-development` |
| D04 | `prd-writing` |
| D05, D12, D16, D17 | `incremental-implementation` |
| D06 | `documentation-and-adrs` |
| D07 | `code-review-and-quality` |
| D10 | `code-review-and-quality` / `agent-browser` |
| D11 | `writing-for-agents` |
| D14 | `test-driven-development` / `incremental-implementation` |
| D15 | `planning-and-task-breakdown` |

## Activation matrix prompts (for live comparison)

Positive: ordinary product copy edit; vague product idea; bounded spec/plan; small bug fix; explicit improve-Flow request; multi-part delegation.

Negative: setup-only `pnpm install`; unrelated regex question; ambiguous one-liner.

Measure: actual `SKILL.md` reads, workflow sections read, authorization boundaries, Skills loaded footer accuracy.

## Live activation

Not run at baseline capture. Status: **missing**.
