Date: 2026-10-24

# Initiative — Flow evaluation suite

**Status:** In progress

## Outcome

Measure whether Flow improves agent behavior on real software tasks using isolated worktrees, hidden stakeholder scripts, deterministic gates, and blinded grading.

Continuous improvement loop (review, remediation batches, accept/revert): [flow-improvement-loop.md](flow-improvement-loop.md).

Protocol v2 (subject / runner / evaluator separation): [ADR 0015](../decisions/adr/0015-evaluation-subject-separation.md), frozen S09/S13 pilot [eval-pilot-s09-s13.md](../specs/eval-pilot-s09-s13.md).

## Scope

- Package `@repo/flow-eval` (CLI, gates, reports, public scenario cards)
- Gitignored catalog and run evidence under `__dev/flow-evals/`
- First-party `flow-eval` skill (local install)
- Preserve baseline run `20261024-flow-v0.1-1256e532` without rewriting it

Out of scope (this wave): new scenarios, arms, dashboards, observer systems, automatic methodology promotion, orchestration frameworks; repairing campaign automation (`self-improve` resume, `experiment`, `stress`, benchmark A/B, `pilot-loop`).

## Waves

### Wave contract — protocol types and freeze

#### task: protocol-contract

- mode: build
- flow_stage: Build
- build_authorized: yes
- writes:
  - .agents/eval/src/types.ts
  - .agents/eval/src/isolation.ts
  - .agents/eval/src/pilot-freeze.ts
  - .agents/flow/decisions/adr/0015-evaluation-subject-separation.md
  - .agents/flow/specs/eval-pilot-s09-s13.md
- acceptance: pnpm --filter @repo/flow-eval check-types

### Wave implement — harness integrity

#### task: evidence-provenance

- mode: build
- flow_stage: Build
- depends_on:
  - protocol-contract
- build_authorized: yes
- writes:
  - .agents/eval/src/host-session.ts
  - .agents/eval/src/isolate.ts
  - .agents/eval/src/trace.ts
  - .agents/eval/src/evidence.ts
  - .agents/eval/src/agent.ts
  - .agents/eval/src/orchestrate.ts
  - .agents/eval/src/cli.ts
  - .agents/eval/src/protocol-validity.test.ts
  - .agents/eval/src/host-session.test.ts
  - .agents/eval/src/isolate.test.ts
- acceptance: pnpm --filter @repo/flow-eval test

#### task: grading-compare

- mode: build
- flow_stage: Build
- depends_on:
  - protocol-contract
- build_authorized: yes
- writes:
  - .agents/eval/src/grade.ts
  - .agents/eval/src/gates.ts
  - .agents/eval/src/report.ts
  - .agents/eval/src/compare.ts
  - .agents/eval/src/product-outcome.ts
  - .agents/eval/src/session-grade.ts
  - .agents/eval/src/grade-from-run.ts
  - .agents/eval/src/legacy-stakeholder.ts
  - .agents/eval/scenarios/oracles/S09.json
  - .agents/eval/scenarios/oracles/S13.json
  - .agents/eval/fixtures/worktrees/S09/ARCHITECTURE.md
  - .agents/eval/src/compare.test.ts
  - .agents/eval/src/grader-integrity.test.ts
  - .agents/eval/src/gates.test.ts
- acceptance: pnpm --filter @repo/flow-eval test

#### task: readiness-docs

- mode: build
- flow_stage: Build
- depends_on:
  - protocol-contract
- build_authorized: yes
- writes:
  - .agents/eval/src/product/readiness.ts
  - .agents/eval/src/product/families/module-check.ts
  - .agents/eval/src/product/families/registry.ts
  - .agents/eval/src/product/remediate.ts
  - .agents/eval/src/product/families/families.test.ts
  - .agents/eval/src/product/readiness.test.ts
  - .agents/eval/RUN.md
  - .agents/skills/flow-eval/SKILL.md
  - .agents/flow/guides/improvement.md
- acceptance: pnpm --filter @repo/flow-eval test

### Wave review

#### task: adversarial-review

- mode: question
- flow_stage: Review
- depends_on:
  - evidence-provenance
  - grading-compare
  - readiness-docs
- writes: []
- skills:
  - code-review-and-quality

integrated_acceptance: pnpm flow:check && pnpm flow-eval:check

## Progress

- [x] Baseline checksum index and `preserve` command
- [x] Deterministic gates and grader package
- [x] Public scenario cards (MVP set)
- [x] Hidden catalog drafts (gitignored)
- [x] First-party `flow-eval` skill in `skills-lock.json` (run `pnpm skills:install`)
- [x] Dry-run harness verification (worktrees, grading, compare-arms)
- [x] Harness v0.2: stream-json normalization, prep baseline diffs, evidence-backed gates/grades, oracles for S01/S02/S09/S13, handoff continuity
- [x] Regression compare command (`compare`, `compare-arms`) and unit tests
- [ ] Protocol v2: subject-evaluator separation, fail-closed evidence and compare (waves above)
- [ ] Frozen S09/S13 pilot prepared via `eval freeze-pilot` — **do not** launch 32 live sessions in implementation
- [ ] Official flow vs control comparison — **blocked** until Cursor provides enforced subject isolation and runner-captured transcripts (see ADR 0015)

## Validation

```bash
pnpm flow:check
pnpm flow-eval:check
pnpm --filter @repo/flow-eval eval preserve
pnpm --filter @repo/flow-eval eval freeze-pilot --seed s09-s13-pilot-2026-10-25
```

Diagnostic host-session runs remain available; they are not official evidence under protocol `subject-evaluator-v2`. Historical `host-session-v1` and v0.1 run `20261024-flow-v0.1-1256e532` stay immutable and are not methodology-performance baselines.

## Findings

### 2026-10-25 protocol validity review (revision `4070c3a`)

| Category | Finding |
| --- | --- |
| **Confirmed** | Worker brief disclosed eval context; `eval record` upgraded origins to `observed`; `protocolVerified` unconditional for host-session; family `READY` with usability `INCONCLUSIVE`; contract file presence treated as engineering pass; S09 empty diff could pass; quality renormalized; compare without strict manifest/eligibility; `sourceSha` from host HEAD at finalize; self-improve blocks on `awaiting-host` |
| **Resolved / narrower** | Control `AGENTS.md` already neutral; starter (non-family) readiness requires browser pass; S13 functional check already evaluator-owned (single input) |
| **Limitation** | Official arm comparison blocked: worktrees and IDE subagents do not enforce filesystem deny; subject-authored transcripts; workspace read boundary is prompt-based |

Historical v0.1 run: partial transcripts, three P0 patterns (unauthorized Build, ADR reversal, fabricated verification). Summary preserved in the gitignored baseline run directory; checksum via `pnpm --filter @repo/flow-eval eval preserve`.

### 2026-10-24 autonomous stress test (Feature Intelligence on `apps/web`)

| Field | Record |
| --- | --- |
| **Type** | Autonomous time-boxed product build on `main` — **not** an official flow vs control experiment |
| **Baseline SHAs** | Pre-assessment `f260e73`; FI introduced `b079228`–`523b43d`; Factory docs migration `277c0cd`; remediation removes FI product |
| **Confirmed delivery** | End-to-end FI slice (intake, support, fixture/live triage, browser journey); follow-up commits fixed web typecheck in pre-commit, Flow Agent tool schemas, and formatting |
| **Confirmed failures** | **ADR 0012 violation** — assessment product shipped in product-neutral `apps/web`; CI red (oxfmt) until docs migration; incomplete machine-verifiable agent trace; no evidence that subagent delegation improved outcomes |
| **Evidence** | Git history `b079228`…`523b43d`; GitHub Actions run [40147684277](https://github.com/gaboesquivel/flow-starter/actions/runs/40147684277) (quality/oxfmt); local `pnpm flow-eval:check` / `eval preserve` intact |
| **Missing evidence** | Full `stream-json` transcripts, timing/token budgets, formal control arm, delegation worker traces |
| **Retained improvements** | Pre-commit `apps/web` / `apps/flow` typecheck; Flow Agent AI SDK + Zod compatibility; Playwright port isolation; Factory/product doc split under `.agents/flow/decisions/` |
| **Removed** | All FI application code, seed data, assessment `CLAUDE.md` / `prompts.txt`, starter `ai`/`zod` deps |

`pnpm eval:experiment -- --profile technical-ai-assessment` records lifecycle `initialized` and release verdict `INCONCLUSIVE` until product checks exist.
