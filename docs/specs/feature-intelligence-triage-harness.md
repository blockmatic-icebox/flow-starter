# Spec: Feature Intelligence — triage agent harness

**Last reviewed:** 2026-10-25  
**Status:** Current  
**Parent:** [feature-intelligence.md](./feature-intelligence.md) · [eve agent](./feature-intelligence-eve-agent.md) · [testing](./feature-intelligence-testing.md)

## Purpose

Define the **host-owned triage harness** that turns a raw feature request into a **decision-ready artifact**. This is **not** the eve operator (`agent/`) and **not** the ask-only web chat—it is the **`@repo/fi` pipeline** invoked by:

- Web submit (`createDraftAndTriage`)
- Eve tool `submit_request`
- (Future) batch jobs / connections

The harness separates **classification** (discrete decisions) from **synthesis** (prose fields), using the same architectural idea as Factory **GenUI** tiering ([genui.md](../../.agents/flow/specs/genui.md)) and the historical **Jev** hook documented in [genui extraction inventory](../../.agents/flow/research/20261024-genui-extraction-inventory.md) (`evaluateWithJev`). **GenUI + Jev remain in `@repo/genui` for the Flow demo pattern**; FI does **not** route triage through GenUI compose. FI **reuses the decision pattern** via AI SDK `experimental_decide` and **Jev through Vercel AI Gateway** (`typesafe-ai/jev`). **Reference:** `@repo/genui` [`model.ts`](../../packages/genui/src/orchestration/model.ts) (gateway + model id string); implementation [`packages/fi/src/ai/gateway.ts`](../../packages/fi/src/ai/gateway.ts). **Decision:** [ADR 0003](../adr/0003-feature-intelligence-model-providers.md).

---

## Design principles

| Principle | Implementation |
| --- | --- |
| **Host-owned policy** | Thresholds, theme catalog, and allowed dispositions live in TypeScript—not prompts alone ([ADR 0011](../../.agents/flow/decisions/adr/0011-api-and-agent-security-boundaries.md)). |
| **Closed-world classification** | Themes and duplicate links are **choices** against supplied candidates. |
| **Open-world synthesis** | Problem statement and decision brief use **`generateObject`** ([ADR 0002](../../.agents/flow/decisions/adr/0002-vercel-ai-sdk-for-tier-3.md)). |
| **Transparency** | Each step appends to `triage_steps` with model id, latency, and decision outputs (redacted in UI if needed). |
| **Degraded path** | Missing `AI_GATEWAY_API_KEY` → lexical theme guess + description as problem + empty dupes; flag `degraded: true`. |

---

## Harness tiers (analogy to GenUI)

| Tier | Triage step | Mechanism |
| --- | --- | --- |
| **T0** | Retrieve duplicate candidates | Deterministic: **lexical top-10** (assessment default; no pgvector) |
| **T1** | Theme fast-path + guards | **Required:** keyword router; if confidence ≥ **0.9**, set `theme_key` and **skip Jev** for theme |
| **T2** | **Classification** | `experimental_decide` + **Jev** — `theme` (if not T1), `link_duplicate`, `is_solution_shaped` only |
| **T3** | **Synthesis** | `generateObject` (structured prose) informed by T2 outputs |
| **T4** | Assemble + persist | Pure TS: merge into `TriageResult`, write DB, candidates table |

```text
title + description + source
        │
        ▼
   [T0 retrieve] ──► candidate request ids + scores
        │
        ▼
   [T2 decide]  ──► theme, link_duplicate, is_solution_shaped
        │
        ▼
   [T3 generateObject] ──► problemStatement, decisionBrief, themeRationale
        │
        ▼
   TriageResult + triage_steps JSON
```

---

## Classification catalog (T2)

**State** passed to `experimental_decide` (multimodal text + JSON parts):

```ts
state: [
  { type: "text", text: `Title: ${title}\n\n${description}` },
  { type: "json", value: { source, candidates: duplicateCandidates } },
];
```

### Questions (v1)

| Question key | Type | Instructions | Criteria / options |
| --- | --- | --- | --- |
| `theme` | **choice** | Best theme (skipped when T1 fast-path fired) | Registry keys; `platform_other` when no fit |
| `link_duplicate` | **choice** | Strongest duplicate link, if any | `none` + each candidate id with one-line label |
| `is_solution_shaped` | **boolean** | Is the submitter prescribing a solution before stating the problem? | — |

**Removed from T2 (MVP):** `urgency` score (use support count in T3 prompt context instead); `suggested_disposition_hint` (moved to T3 optional field).

**Theme registry** (closed set; seed + new requests must map here):

| Key | Label | Description (for Jev criteria) |
| --- | --- | --- |
| `reporting_exports` | Reporting & exports | CSV, PDF, scheduled reports, dashboards export |
| `collaboration_sharing` | Collaboration & sharing | Sharing, comments, co-editing, external viewers |
| `integrations_alerts` | Integrations & alerts | Slack, PagerDuty, webhooks, mobile push |
| `platform_other` | Platform / other | Cross-cutting infra, perf, admin when no theme fits |

Persist **`theme_key`** + **`theme_label`** (from registry) on the request row; filters use `theme_key` only.

### Jev model configuration (AI Gateway only)

Use **`@ai-sdk/gateway`** — do not use `@ai-sdk/anthropic` for T2/T3.

```ts
import { experimental_decide } from "ai";

import { getFiDecisionModel } from "../ai/gateway";

const model = getFiDecisionModel();
if (!model) {
  /* degraded path */
}

await experimental_decide({
  model,
  // ...
});
```

- **Credential:** `AI_GATEWAY_API_KEY` (server only).
- **Default model id:** `typesafe-ai/jev` (`FI_DECISION_MODEL`).
- **T3 synthesis:** same gateway via `getFiSynthesisModel()`; default `anthropic/claude-sonnet-4.6` (`FI_SYNTHESIS_MODEL`).
- Log resolved model ids in `triage_steps`.

### Confidence and fallbacks

- If `experimental_decide` throws or times out (**8s** budget for T2): set `theme` from keyword router (`classifyThemeDeterministic`), `link_duplicate` = `none`, `degraded: true`.
- **T1 keyword router** (required in Build): confidence ≥ 0.9 → skip Jev for `theme`; record `step: "classify_theme", method: "deterministic"`. Same pattern as `packages/genui/src/orchestration/routing.ts`.

---

## Synthesis (T3)

**Input context:** title, description, source, T2 answers, top duplicate snippets.

**`generateObject`** schema (Zod):

```ts
{
  problemStatement: string,      // max 500 chars
  themeRationale: string,      // 1–2 sentences tying to theme choice
  decisionBrief: string,       // PM paragraph: what, who cares, support context, suggested next step
  dispositionSuggestion: string | null, // optional one-liner to pre-fill PM rationale—not a disposition
  duplicateExplanations: { requestId: string, explanation: string }[], // subset of linked ids
}
```

**Model:** `getFiSynthesisModel()` — gateway id default `anthropic/claude-sonnet-4.6`; max tokens bounded.

**`dispositionSuggestion`** pre-fills PM rationale textarea only; never writes `disposition` column.

---

## Public API (`@repo/fi`)

```ts
// packages/fi/src/triage/run-triage-harness.ts
export const runTriageHarness = async (input: {
  title: string;
  description: string;
  source: FeatureRequestSource;
  requestId: string; // draft id for logging
}) => Promise<TriageHarnessResult>;
```

**`TriageHarnessResult`**

| Field | Source |
| --- | --- |
| `problemStatement`, `theme`, `themeRationale`, `decisionBrief` | T3 + T2 |
| `duplicateCandidates` | T0 scores filtered by T2 `link_duplicate` |
| `recommendedIntakeLinkId` | T2 `link_duplicate` when not `none` — UI default for confirm; persisted as `intake_linked_request_id` |
| `triageConfidence` | Aggregate (min of decision confidences if exposed, else 0.7 default) |
| `suggestedDispositionHint` | T2 |
| `triageSteps` | Full audit trail |
| `degraded` | boolean |

**Idempotency:** Caller creates draft row first; harness updates same row.

---

## Package layout (Build)

```text
packages/fi/src/triage/
  run-triage-harness.ts      # orchestrator
  retrieve-candidates.ts     # T0
  classify-decisions.ts      # T2 experimental_decide
  synthesize-artifact.ts     # T3 generateObject
  theme-registry.ts          # closed catalog + deterministic fallback
  types.ts                   # TriageHarnessResult, step types
  harness.test.ts            # fixture-driven (no API key)
packages/fi/eval/
  triage-matrix.ts           # labeled requests → expected theme + link (offline)
```

**Dependencies (product):** `ai`, `zod`, `@ai-sdk/gateway` ([`gateway.ts`](../../packages/fi/src/ai/gateway.ts)). **Do not** add Jev to `@repo/genui` for FI.

---

## Relationship to other agents

| Component | Relationship |
| --- | --- |
| **eve `agent/`** | Calls `createDraftAndTriage` → harness; may **narrate** results; does not re-implement classification. |
| **Ask-only `/chat`** | No harness calls in v1. |
| **GenUI / Flow demo** | Gateway model wiring in `@repo/genui`; historical `apps/flow` chat used `streamText` ([ADR 0010](../../.agents/flow/decisions/adr/0010-site-consultant-chat-and-mcp.md)) — FI `/chat` ports that pattern with **direct Anthropic** per [ADR 0003](../adr/0003-feature-intelligence-model-providers.md). |

---

## Testing

| Layer | Approach |
| --- | --- |
| **Harness unit** | `triage-matrix.ts` fixtures: mock `experimental_decide` / inject T2 outputs; assert T3 schema assembly and `triage_steps` shape. |
| **Offline eval** | `pnpm --filter @repo/fi eval:triage` (script TBD) — like `pnpm eval:genui:offline`. |
| **Live** | One manual submit + eve `submit_request` with gateway key before demo recording. |
| **Web** | Manual W-2/W-3 per [testing spec](./feature-intelligence-testing.md). |

**CI (MVP):** Run harness unit tests without API keys; skip live decide tests when `AI_GATEWAY_API_KEY` unset.

---

## Environment

| Variable | Purpose |
| --- | --- |
| `AI_GATEWAY_API_KEY` | **Required for live Jev + triage synthesis** (gateway only) |
| `FI_DECISION_MODEL` | Default `typesafe-ai/jev` |
| `FI_SYNTHESIS_MODEL` | Default `anthropic/claude-sonnet-4.6` (via gateway) |
| `FI_TRIAGE_TIMEOUT_MS` | Total harness budget (default 20000) |

**Not used by harness:** `ANTHROPIC_API_KEY` (ask-only `/chat` only — [ADR 0003](../adr/0003-feature-intelligence-model-providers.md)).

---

## Acceptance criteria

| ID | Criterion |
| --- | --- |
| TH-1 | Harness runs T0→T2→T3 and persists `triage_steps` with step names matching transparency spec. |
| TH-2 | Theme always one of registry keys (or deterministic fallback when degraded). |
| TH-3 | `link_duplicate` never invents an id not in T0 candidates. |
| TH-4 | Offline matrix ≥12 cases (themes + dup links + solution-shaped) passes without network. |
| TH-5 | Web and eve share identical harness output for same input (single `@repo/fi` call). |
| TH-6 | `recommendedIntakeLinkId` present when Jev selects a duplicate link; confirm persists it for intake link rate. |

---

## Approval

**Accepted.** Optimized for [product metrics](./feature-intelligence.md#product-metrics-first).
