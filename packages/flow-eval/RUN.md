# Flow evaluation runner

User-invoked methodology evaluations for Flow. Evidence stays under `__dev/flow-evals/`. The historical run `20261024-flow-v0.1-1256e532` is read-only.

## Commands

```bash
pnpm --filter @repo/flow-eval eval preserve
pnpm --filter @repo/flow-eval eval grade --run <runId> --scenario S01
pnpm --filter @repo/flow-eval eval pilot --model composer-2.5
pnpm --filter @repo/flow-eval eval run --scenarios S01,S02,S05,S09,S13 --arm flow --model composer-2.5
pnpm --filter @repo/flow-eval eval run --scenarios S01 --dry-run
pnpm --filter @repo/flow-eval eval compare --baseline run-a --current run-b
pnpm --filter @repo/flow-eval eval handoff --variant C1 --model composer-2.5
```

Official scored runs require `agent login` or `CURSOR_API_KEY`. Without auth, the CLI writes `__dev/flow-evals/cli-auth-blocker.json` and exits.

## Event origins

Every recorded event uses one of: `observed`, `agent-reported`, `evaluator-inference`, `missing`.

## Evidence layout

```
__dev/flow-evals/<runId>/
  manifest.json
  summary.md
  scores.json
  scenarios/<id>/
    transcript.jsonl
    stream.raw.log
    diff.patch
    score.json
    report.md
    worktree-path.txt
```

Hidden stakeholder scripts: `__dev/flow-evals/catalog/<scenarioId>/hidden.json` (not in executor worktrees).

## Grading

Deterministic gates run first. Markdown reports lead with **Gate**, then quality (withheld when confidence is low).

## Arms

- `flow` — default Flow entrypoint and skills symlink
- `flow-without-skills` — Flow docs, no `.agents/skills`
- `control` — minimal `AGENTS.md`, workflow and skills router removed from worktree
