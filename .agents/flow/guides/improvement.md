# Learning and improvement

Two questions often get conflated: **Did the change work technically?** and **Did it help the product?** Flow keeps them separate.

## Customer learning versus technical correctness

- **Review** checks alignment with acceptance criteria, tests, security, and documentation ([flow.md](../flow.md)).
- A working implementation does **not** prove customer value.
- **Ship** should report what ran, what stayed unverified, and product outcome evidence—or say outcome evidence is still unknown.

**Example:** Fixing date sorting is complete when behavior and named checks match. A comments initiative is not “learned” until you have evidence about the assumption or explicitly record that evidence is still missing.

## Evaluating Flow today (implemented)

The `@repo/flow-eval` package provides a **user-invoked** harness: isolated worktrees, scenario cards, deterministic gates, and comparison between arms (`flow`, `flow-without-skills`, `control`). The `flow-eval` skill runs those commands; it does not auto-modify workflow.

| Piece | Role |
| --- | --- |
| Frozen baseline run | Historical reference; preserved, not rewritten |
| Gates | Run before quality narrative; incomplete telemetry is `missing`, not zero |
| Arms | Compare Flow entrypoint vs reduced context |
| `flow:check` | Validates doc paths and bundle freshness—not product outcomes |

Command reference: [packages/flow-eval/RUN.md](../../../packages/flow-eval/RUN.md). Initiative status: [flow-evaluation-suite.md](../initiatives/flow-evaluation-suite.md). As of that initiative, an **authenticated official pilot** may still be blocked pending CLI auth; treat live batch claims as in-progress unless the initiative says otherwise.

## Human-reviewed improvement loop (operating process)

Documented in [flow-improvement-loop.md](../initiatives/flow-improvement-loop.md). This is the **intended** operating process—not an automatic system that rewrites Flow.

```mermaid
flowchart LR
  freeze[Freeze baseline]
  test[Test]
  diagnose[Diagnose]
  propose[Propose remediation]
  review[Human review]
  implement[Implement approved batch]
  compare[Compare]
  decide[Accept revise revert]
  freeze --> test --> diagnose --> propose --> review --> implement --> compare --> decide
```

**Side constraint:** an evaluation run does **not** edit [flow.md](../flow.md), rubrics, or skills. Gabo and a reviewing assistant approve remediation batches before implementation.

**Automated observation (planned):** [flow-self-improvement.md](../initiatives/flow-self-improvement.md) describes a default-off event log, clustering, and L1 human promotion reusing the same harness. Staged autonomy is [ADR 0013](../decisions/adr/0013-flow-improvement-autonomy.md) (**Proposed**); auto-merge (L2) is not active.

Rejected for this loop (per initiative): scheduled eval cron, dashboard, orchestration platform, grading agents on stage labels alone, single opaque quality score as ship decision.

## Limits

- Flow documentation does not demonstrate product–market fit for your product or for Flow globally.
- Mechanical checks cannot prove semantic agreement with product intent.
- Historical research proposed a stronger **Ship → Explore** product loop; that is not fully implemented as automation—Ship still asks you to capture findings when you have them.

## Where to go next

- Day-to-day activities: [working-with-flow.md](working-with-flow.md)
- Operational Ship requirements: [flow.md](../flow.md)
- Run evaluations: [RUN.md](../../../packages/flow-eval/RUN.md)
