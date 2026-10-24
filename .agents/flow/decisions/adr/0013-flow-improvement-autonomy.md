Date: 2026-10-24

# ADR 0013 — Flow improvement autonomy

**Status:** Proposed

## Context

Flow Starter dogfoods its own methodology while building product features. A separate improvement path could observe sessions, propose changes to workflow and agent instructions, evaluate candidates against a frozen baseline, and integrate accepted changes. That path must not conflict with [flow.md](../../flow.md) (implementation authorization, never push without explicit authorization) or [flow-improvement-loop.md](../../initiatives/flow-improvement-loop.md) (evaluations do not self-modify workflow or skills; no automatic merge).

An earlier planning revision assumed automatic merges into `main`. That contradicts current repository rules and an unvalidated evaluator: the frozen baseline `20261024-flow-v0.1-1256e532` has zero complete live transcripts. Auto-promotion would optimize noise.

The initiative [flow-self-improvement.md](../../initiatives/flow-self-improvement.md) defines staged autonomy **L0–L3**, a fail-open event boundary, human promotion at **L1**, and optional **L2** auto-merge for low-risk wording-only changes after sustained evidence.

## Decision

1. **Ship L0 and L1 only** until this ADR is explicitly superseded or **Accepted** with L2 preconditions met. L0 appends redacted metadata when `flow-improve.config.json` has `enabled: true`. L1 produces a candidate branch and ledger row; a human runs `pnpm flow-improve promote <id> --apply`. The integrator script never pushes.
2. **L2 is specified but inactive.** Auto-merge of low-risk candidates (wording clarity, redundant-line removal, examples that do not change gates, approval sentences, or routing tables) requires: this ADR status **Accepted**; at least three prior **L1** promotions with zero canary failures; recorded human opt-in; and a Phase 0 grader that rejects a known-bad Flow variant. L2 still does not authorize `git push`.
3. **L3 (auto-medium)** is out of scope for the MVP initiative.
4. **Authorization layering unchanged for push.** Local scoped commits during authorized **Build** remain as in [flow.md](../../flow.md). L2, if ever accepted, may commit accepted low-risk improvements to local `main` without a per-candidate implementation message, but never without the promotion gates in the initiative and never with push implied.
5. **Accepting L2 later** must be one human-approved change set that updates [flow-improvement-loop.md](../../initiatives/flow-improvement-loop.md), [improvement.md](../../guides/improvement.md), and a size-neutral pointer in [flow.md](../../flow.md) if needed.

## Alternatives considered

### Stay at manual `flow-eval` + human branch forever (L1 cap)

- Pros: Minimal automation risk; matches current initiative text; review time ~15 minutes per candidate when reports are tight.
- Cons: Repeated failures are rediscovered without L0 clustering.
- **Chosen as the recommended stopping level** until L2 preconditions are met.

### Auto-merge on day one (v1 plan)

- Pros: Fewer human integration steps.
- Cons: Conflicts with flow-improvement-loop; evaluator not validated on complete traces; reverts are costly.
- **Rejected.**

### Full autonomous self-modification including evaluator and rubric

- Pros: Could tune the grader to match preferences.
- Cons: Reward hacking; candidate could weaken gates; violates initiative invariants.
- **Rejected.** Evaluator, rubric, holdout, and promotion policy stay human-protected paths.

## Consequences

- Product agents are unaffected when improvement is disabled or when the observer fails (fail-open hooks).
- Humans remain accountable for L1 promotion and all pushes.
- L2 remains documented so it cannot be implemented silently; no L2 code ships in the MVP build.
- Portability (Phase 7) depends on config and hooks, not Flow Starter–specific paths in the observer.

## Related documents

- [flow-self-improvement.md](../../initiatives/flow-self-improvement.md)
- [flow-improvement-loop.md](../../initiatives/flow-improvement-loop.md)
- [improvement.md](../../guides/improvement.md)
- [flow.md](../../flow.md)
- [packages/flow-eval/RUN.md](../../../../packages/flow-eval/RUN.md)
