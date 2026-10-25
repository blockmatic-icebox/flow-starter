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
pnpm --dir .agents check    # Factory integrity
pnpm --dir .agents test     # Factory tests + eval unit tests
pnpm worktrees              # Initiative orchestration (delegates here)
pnpm flow-eval:check        # Deterministic evaluation preservation
```

Product code lives in `apps/web` and `packages/*`. Product must not import Factory implementation.
