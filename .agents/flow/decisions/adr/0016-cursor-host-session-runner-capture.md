Date: 2026-10-25

# ADR 0016 — Cursor host-session runner capture

**Status:** Accepted

## Context

[ADR 0015](0015-evaluation-subject-separation.md) blocked official arm comparison on Cursor IDE host-session because transcripts were subject-authored and isolation was static.

## Decision

1. **Runner channel:** `eval observe` appends `origin: observed` events to `runner-transcript.jsonl`; subjects remain on `eval record` (`agent-reported` only).
2. **Grading:** Finalize merges subject + runner transcripts; `protocolVerified` follows per-scenario rules in `.agents/eval/src/host-protocol.ts`.
3. **Isolation:** Runner capture supports diagnostic grading; **official** `officialComparisonAllowed` on worktree hosts is superseded by [ADR 0017](0017-official-compare-fail-closed.md) (fail-closed until sandbox).
4. **Residual limitation:** Enforced workspace read boundary is **unsupported** (same-machine absolute-path reads). Official claims must cite this limitation.

## Alternatives considered

### Continue blocking all official compare on Cursor host-session

- Pros: No harness change.
- Cons: Cannot validate Flow vs control on the primary IDE adapter.
- **Rejected** in favor of runner observe with declared residual limits.

### Treat subject self-reported commands as observed

- Pros: Simpler runner workflow.
- Cons: Violates ADR 0015 provenance rules.
- **Rejected.**

## Consequences

- Diagnostic runs may use `--accept-diagnostic` on finalize.
- Pilot and compare still require blind review where the rubric specifies (e.g. S09 `conflictHandling`).

## Related documents

- [ADR 0017 — Official comparison fail-closed](0017-official-compare-fail-closed.md) (supersedes isolation eligibility bullets in this ADR)
- [ADR 0015 — Evaluation subject separation](0015-evaluation-subject-separation.md)
- [.agents/eval/RUN.md](../../../eval/RUN.md)
- [flow-evaluation-suite.md](../../initiatives/flow-evaluation-suite.md)
