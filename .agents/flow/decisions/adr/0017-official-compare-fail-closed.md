Date: 2026-10-25

# ADR 0017 — Official comparison fail-closed on worktree hosts

**Status:** Accepted

## Context

[ADR 0016](0016-cursor-host-session-runner-capture.md) introduced runner `eval observe` for diagnostics. Trial-level assessment briefly treated runner transcript presence as proof of hidden-oracle separation and official eligibility on same-machine Cursor worktrees. That contradicted [ADR 0015](0015-evaluation-subject-separation.md) and allowed unsupported official claims.

## Decision

1. **Official flow-vs-control comparison** remains **blocked** on Cursor IDE and headless worktree hosts until a **verified container sandbox** (or equivalent enforced boundary) is integrated and recorded in runner capture manifests.
2. **Runner observe** accepts only **trusted** events (`captureMethod: runner-subprocess`) produced by runner-owned invoke/verify scripts; worker-reported rows are never promoted to `observed`.
3. **Diagnostic evaluations** may complete with valid task/gate evidence while `officialEligible` stays false.
4. **Model identity** (`--model-id` / `FLOW_EVAL_MODEL_ID`) is required for comparative eligibility grading on protocol `subject-evaluator-v2`.
5. ADR 0016 remains historical; its isolation bullet allowing `officialComparisonAllowed` on cursor+runner is **superseded** by this ADR.

## Alternatives considered

### Allow official compare on Cursor when runner transcript exists

- Pros: Simpler operator workflow.
- Cons: Same-machine worktrees do not enforce oracle separation; violates ADR 0015.
- **Rejected.**

### Block all runner observe capture

- Pros: No provenance ambiguity.
- Cons: Loses diagnostic command evidence for graders.
- **Rejected** in favor of trusted runner-subprocess capture with fail-closed official eligibility.

## Consequences

- `assessIsolationFromTrial` never marks filesystem or oracle separation as supported on worktree-only hosts.
- Headless `eval headless-run` prepares runs but official compare still requires future sandbox work.
- Documentation and `/flow-eval` describe diagnostic vs official paths explicitly.

## Related documents

- [ADR 0015 — Evaluation subject separation](0015-evaluation-subject-separation.md)
- [ADR 0016 — Cursor host-session runner capture](0016-cursor-host-session-runner-capture.md)
- [.agents/eval/RUN.md](../../../eval/RUN.md)
