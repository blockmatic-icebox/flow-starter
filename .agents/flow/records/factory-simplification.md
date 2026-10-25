# Factory simplification initiative

**Objective:** Radically simplify Flow Factory while preserving product development, dogfooding, evaluation validity, and native Cursor subagent coordination.

**Starting revision:** `603ed51e963cdde5d5e5579e273a144d914f87f9`  
**Plan:** Flow Factory radical simplification (staged delivery on `main`)

## Stage 0 baseline metrics (before)

| Metric | Value |
| --- | --- |
| `.agents/flow/flow.md` lines | 455 |
| `.agents/eval/src/cli.ts` lines | 840 |
| `.agents` TS/MJS source files | 163 |
| Root `devDependencies` count | 13 |
| `.agents/package.json` scripts | 26 |
| Worktree tooling LOC (`.mjs` under `tooling/worktrees/`) | ~2957 |
| Root workspace includes `.agents/eval` | yes |
| Eval depends on `@repo/ts` | yes |
| Root `prompts.txt` | empty at repo root |

## Classification (audit)

- **KEEP:** Product apps/packages, ADR 0015, CI product/factory split, GenUI eval, ownership checks, frozen baselines.
- **MOVE:** `prompts.txt` → `.agents/flow/`, skills-lock, Factory scripts off root.
- **SIMPLIFY:** `flow.md`, eval CLI, worktrees, `/flow-eval` parent report.
- **DELETE:** Root eval workspace registration, redundant orchestration after native subagent path verified.

## Stage log

| Stage | Commit | Summary |
| --- | --- | --- |
| 0 | (pending) | Baseline record + metrics |

## §13 acceptance checklist

| # | Theme | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Visual reference in Explore | pending | |
| 2 | Evolving requirements | pending | |
| 3 | Flow improves Flow | pending | |
| 4 | Parallel work | pending | |
| 5 | `/flow-eval` reporting | pending | |
| 6 | Product without `.agents/` | pending | |
| 7 | Missing worker evidence | pending | |
| 8 | Prompt log history | pending | |
| 9 | Historical records / ADR 0015 | pending | |
