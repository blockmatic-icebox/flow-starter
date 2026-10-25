# Flow Factory (`.agents/`)

Self-contained Flow Factory: methodology, skills, evaluation, tooling, and worker definitions.

| Area                      | Path                                |
| ------------------------- | ----------------------------------- |
| Methodology and decisions | `.agents/flow/`                     |
| Skills                    | `.agents/skills/`                   |
| Evaluation engine         | `.agents/eval/` (`@repo/flow-eval`) |
| Scripts and checks        | `.agents/tooling/`                  |
| Worker definitions        | `.agents/agents/`                   |

**Commands** (from repository root):

```bash
pnpm --dir .agents check      # Factory integrity (flow docs, architecture, ownership, eval preserve)
pnpm --dir .agents test       # Factory tests + eval unit tests
pnpm --dir .agents worktrees  # Initiative orchestration
pnpm --dir .agents eval integrity   # Layer A: preserve + mutation checks
```

Eval runner docs: [eval/RUN.md](eval/RUN.md). Supported diagnostics and `/flow-eval` use host-session commands; `eval:experiment` and `eval:self-improve` are **experimental and unmaintained** (not part of `integrity` or `/flow-eval`).

Product code lives in `apps/web` and `packages/*`. Product QA: `pnpm qa`. Product must not import Factory implementation.

New evaluation evidence defaults to `.agents/eval/evidence/` (gitignored). Legacy runs under `__dev/flow-evals/` remain readable.
