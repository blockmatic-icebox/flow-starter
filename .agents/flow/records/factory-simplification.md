# Factory simplification initiative

**Objective:** Radically simplify Flow Factory while preserving product development, dogfooding, evaluation validity, and native Cursor subagent coordination.

**Starting revision:** `603ed51e963cdde5d5e5579e273a144d914f87f9`  
**Final revision:** `e02d8e4` (see stage log for intermediate SHAs)  
**Branch:** `main`

## Stage log

| Stage | Commit | Summary |
| --- | --- | --- |
| 0 | `0f30411` | Baseline metrics + initiative record |
| 1 | `6381d71` | Eval out of root workspace; `.agents` install; skills-lock move; ownership |
| 2 | `5ade9db` | Journal under `.agents/flow`; Explore-time DESIGN |
| 3–6 | `e02d8e4` | Flow doc map; subagent-first delegation; eval `integrity` + bounded suite; `/flow-eval end-to-end` skill |

## §16 consolidated report

### A. Repository state

- **Start:** `603ed51` on `main`, remote `flow-factory`, local path `flow-starter`
- **End:** `e02d8e4` on `main` (plus pending stage 7 commit)
- **Uncommitted:** none after final push

### B. What changed

- **Deleted:** root `prompts.txt`, root `skills-lock.json`, root eval workspace membership, root `skills`/`commits:check` scripts
- **Moved:** prompt log → `.agents/flow/prompts.txt`; skills-lock → `.agents/skills-lock.json`; eval invoke → `pnpm --dir .agents eval`
- **Consolidated:** flow-eval public CLI docs; default diagnostic scenario list; journal format in `operations/journal.md`
- **Retained:** ADR 0015, frozen baseline preserve, product/factory CI split, worktree safety checks, GenUI/product tests

### C. Product/Factory boundary

- Product workspace: `apps/*`, `packages/*` only
- Factory: `.agents/` (+ `.agents/pnpm-lock.yaml` for eval harness deps)
- Host adapters: `AGENTS.md`, `.cursor/commands/flow-eval.md`, git hooks calling `.agents` checks

### D. Methodology

- Progressive disclosure map in `flow.md`; delegation prefers Cursor Task subagents
- DESIGN allowed in Explore without journeys; extended prompt log spec
- `flow-improve` unchanged entry; dogfooding pipeline in `guides/dogfooding-eval.md`

### E. Dogfooding

- Prompt log: `.agents/flow/prompts.txt` with structured entries (`operations/journal.md`)
- Records: this file + per-initiative pattern under `records/`

### F. Evaluation

- **Layer A:** `pnpm --dir .agents eval integrity` (preserve + mutations)
- **Layer B:** `/flow-eval end-to-end` diagnostic (parent report template in flow-eval skill)
- **Layer C:** `compare` remains fail-closed; official compare **blocked** for Cursor host-session (ADR 0015)
- Default suite IDs: S01, S02, S04, S05, S09, S13, S16

### G. Subagents

- Documented worker return contract in flow-eval skill
- `worktrees run` warns to prefer Task subagents; check/prepare/integrate retained

### H. Tests (executed)

| Command | Exit |
| --- | --- |
| `pnpm qa` | 0 |
| `pnpm --dir .agents check` | 0 |
| `pnpm --dir .agents test` | 0 |
| `pnpm --dir .agents flow-eval:check` | 0 |
| Product copy without `.agents/` + `pnpm qa` | knip requires trimming root knip `.agents` entries (documented normalization) |

### I. Simplification metrics

| Metric | Before | After |
| --- | --- | --- |
| `flow.md` lines | 455 | 468 (map added; dedup via links) |
| `cli.ts` lines | 840 | 840 (surface reduced; legacy handlers internal) |
| `.agents` TS/MJS files | 163 | 164 |
| Root workspace `.agents/eval` | yes | no |
| Eval `@repo/ts` dep | yes | no |

### J. Follow-ups

| Pri | Item |
| --- | --- |
| P2 | Further trim `flow.md` body into operations guides |
| P2 | Remove unused eval CLI handlers (`experiment`, `self-improve`, …) after consumer audit |
| P2 | Optional `knip` workspace split purely under `.agents` for cleaner product-only copies |
| P1 | Run live `/flow-eval end-to-end` campaign when host isolation improves |

## §13 acceptance checklist

| # | Theme | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Visual reference in Explore | partial | DESIGN template + skill; manual scenario not run |
| 2 | Evolving requirements | partial | S04 in default suite; journal format |
| 3 | Flow improves Flow | pass | dogfooding-eval.md + flow-improve path |
| 4 | Parallel work | pass | AGENTS.md + worktrees.md + run warning |
| 5 | `/flow-eval` reporting | pass | flow-eval SKILL end-to-end template |
| 6 | Product without `.agents/` | partial | install+qa works after knip normalization |
| 7 | Missing worker evidence | pass | ADR 0015 + existing gate tests |
| 8 | Prompt log history | pass | journal.md + tests |
| 9 | Historical records / ADR 0015 | pass | preserve exit 0; ADR untouched |
