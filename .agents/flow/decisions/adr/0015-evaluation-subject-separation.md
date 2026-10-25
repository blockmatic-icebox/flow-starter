Date: 2026-10-25

# ADR 0015 — Evaluation subject separation

**Status:** Accepted

## Context

Flow evaluations must measure whether Flow changes agent behavior on real software tasks without contaminating the control arm or treating subject self-reports as independent evidence. Prior harness versions allowed subjects to operate the eval CLI, disclosed scenario and arm context in worker briefs, defaulted missing event origins to `observed`, and treated host-session runs as protocol-verified without runner capture.

Cursor IDE subagents receive a clean conversation and workspace `AGENTS.md`, but same-machine worktrees do not enforce filesystem deny lists, subjects can inherit global skills and MCP tools, and host-session recording was subject-authored. Official flow-vs-control claims therefore require explicit separation of roles and fail-closed eligibility until a runner can capture evidence independently.

## Decision

1. **Three roles:** Subject (task and product workspace only), runner (workspaces, messages, captured evidence), evaluator (frozen oracle, outcomes, limitations). Subjects do not run eval CLI commands or propose methodology fixes.
2. **Protocol id `subject-evaluator-v2`:** New runs use this protocol. Historical `host-session-v1` and `cursor-cli-stream-json-2026.10` artifacts remain readable but cannot be official under v2 rules.
3. **Evidence provenance:** Only runner-captured or independently verified events may use origin `observed`. Subject record channels accept `agent-reported` only. Missing origin fails validation.
4. **Evidence validity vs comparative eligibility:** Task and gate outcomes are separate from whether a trial may support official cross-arm claims. Observed agent failures remain valid evidence. Comparative eligibility requires comparison-grade evidence, complete session telemetry, compatible frozen configuration, and a passing isolation assessment for the **inspected** execution adapter (Cursor IDE host-session today: **unsupported**). Unknown hosts are **unknown** and blocked.
5. **Reporting:** No renormalized overall quality percentage. Report per-gate results, evidence validity, comparative eligibility, task outcome, verification-claim result (verified / contradicted / unsupported / n/a), evidence completeness, and individual subjective dimensions when reviewed.
6. **Comparisons:** Fail closed on manifest mismatch, missing metadata, ineligible grades, or unsupported isolation. Historical run `20261024-flow-v0.1-1256e532` is an immutability fixture only, not a methodology-performance baseline.
7. **Pilot outcomes:** Favorable pilot results generate a candidate hypothesis; methodology edits require investigation, independent confirmation, and explicit user authorization.
8. **Product readiness:** Family contract modules and candidate `runAcceptance()` do not establish application `READY`; inconclusive usability prevents `READY`.

## Alternatives considered

### Continue host-session as official with prompt-only prohibitions

- Pros: Minimal harness change.
- Cons: Does not prevent oracle access or self-reported transcripts; invalidates control comparisons.
- **Rejected.**

### Build a new external runner platform in this change

- Pros: Could enforce isolation.
- Cons: Out of scope; plan forbids substituting a platform to avoid reporting limitations.
- **Rejected.**

### Require Cloud Agent VMs for all official runs

- Pros: Stronger isolation.
- Cons: Clones full repo including oracles; not integrated in this wave; paid/live trials out of scope.
- **Deferred.**

## Consequences

- Official improvement claims stay blocked for Cursor IDE host-session until isolation and capture gaps are closed or a supported runner is integrated.
- Diagnostic runs and deterministic unit tests remain the primary development path.
- Pilot specification lives in [.agents/flow/specs/eval-pilot-s09-s13.md](../../specs/eval-pilot-s09-s13.md).

## Related documents

- [flow-evaluation-suite.md](../../initiatives/flow-evaluation-suite.md)
- [RUN.md](../../../eval/RUN.md)
- [eval-pilot-s09-s13.md](../../specs/eval-pilot-s09-s13.md)
- [improvement.md](../../guides/improvement.md)
