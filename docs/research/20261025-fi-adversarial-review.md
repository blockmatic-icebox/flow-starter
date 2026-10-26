# Research: Feature Intelligence adversarial review

**Research date:** 2026-10-25  
**Last reviewed:** 2026-10-25  
**Status:** Current  
**Branch:** `meta-cto`  
**Purpose:** Evidence-backed reconciliation of an independent adversarial review vs code and contracts; input to [remediation spec](../specs/feature-intelligence-remediation.md).

## Summary

The assessment delivers a credible **intake → publish → triage → insights** demo with seed scale and Eve smoke evals. Gaps are **workflow completeness** and **verification honesty**: several behaviors are specified and marked complete in contracts but are missing or partial in `@repo/fi` and `apps/web`.

**Retrospective lesson (accepted):** Ship **domain truth** (validation, merge, discovery, AI failure paths) before **demo polish** (500-row seed, trends dashboard). Track **implementation fidelity** separately from “MVP checklist complete.”

## Finding reconciliation

| # | Finding | Verdict | Evidence (representative) |
| --- | --- | --- | --- |
| 1 | Merge without target; no rollup | **Defect** | `triage-panel.tsx` — Merge without `mergeTargetId` UI; `set-disposition.ts` — no merge validation or supporter rollup |
| 2 | AI errors leave stuck triage | **Partial** | Harness degraded paths exist; submitter UX (submit anyway, retry, needs-review flag) not end-to-end |
| 3 | Decision transparency | **Partial** | Rationales persisted; no disposition history, actor, merge target on stakeholder-facing detail |
| 4 | Domain integrity | **Defect** | Empty rationale and invalid transitions not rejected at domain layer |
| 5 | Discovery | **Defect** | `search-requests.ts` capped at 20; `/requests` — no search, sort, pagination, list support counts |
| 6 | Prioritization | **Open (Specify)** | Support sort only; lightweight extra sorts acceptable without rubric editor |
| 7 | Duplicate intelligence | **Accepted partial** | Lexical retrieve per initiative; improve confidence honesty in copy |
| 8 | Analytics | **Scrutiny** | Trends use DB timestamps; seed uses synthetic `seedSteps`; open-queue denominator intentional for demo |
| 9 | DB safety | **Defect** | `seed/load.ts` truncates FI tables without production guard |
| 10 | Verification | **Defect** | Some smoke evals static (source grep); weak outcome assertions on DB state |
| 11 | Spec drift | **Defect** | `PRODUCT.md` / tasks claimed complete while rows 1–5, 9–10 unresolved |

## Decided (remediation — human approved)

| Topic | Decision |
| --- | --- |
| Auth | Out of scope; simulated PM actor on disposition audit |
| Merge | Real merge: target required; **supporter rollup** to target (dedupe keys, refresh counts); source archived/merged with link to canonical |
| AI failure | Never block submit; degraded path; **Submit anyway** + **Retry AI review**; flag **needs AI/manual review** for PM queue with failure metadata |
| Discovery | Search + sort (support, recent, title) + pagination (~25/page) + support count on cards |
| Transparency | **Assumed (default C):** Public detail shows outcome label + short rationale; full audit (timestamp, simulated PM, merge target) on detail sidebar |
| UI automation | No new Playwright for FI |
| Agent/API TDD | Eve tools + server actions over `@repo/fi` (no separate FI MCP product server in repo) |
| Sequencing | Remediation before further peripheral features |

## Open / deferred

| Topic | Status |
| --- | --- |
| Prioritization beyond sort keys | **Open** — queue sort options in remediation; no strategic rubric editor |
| pgvector / semantic dedupe | **Deferred** (non-goal) |
| Auth, notifications | **Deferred** |

## Factory feedback (separate track)

- Checklist “complete” should require **AC + code + test** row, not task checkbox alone.
- Static source-grep “evals” should be disallowed in [feature-intelligence-testing.md](../specs/feature-intelligence-testing.md) remediation section.

## Agentic discoverability baseline (2026-10-26)

`npx is-agentic meta-cto-two.vercel.app` → **59/100**. Notable gaps: `markdown-negotiation-vary` (failed), `mcp-server` (partial — no `/.well-known/mcp` handshake on origin). Plan: [agentic discoverability spec](../specs/feature-intelligence-agentic-discoverability.md).

## Related

- [feature-intelligence-remediation.md](../specs/feature-intelligence-remediation.md)
- [ADR 0004](../adr/0004-fi-workflow-integrity-and-safety.md)
- [20261025-fi-browser-verification.md](./20261025-fi-browser-verification.md)
