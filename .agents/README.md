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
```

Product code lives in `apps/web` and `packages/*`. Product QA: `pnpm qa`. Product must not import Factory implementation.

New evaluation evidence defaults to `.agents/eval/evidence/` (gitignored). Legacy runs under `__dev/flow-evals/` remain readable.
