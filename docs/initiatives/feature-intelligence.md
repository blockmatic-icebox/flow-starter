# Initiative: Feature Intelligence (Meta CTO assessment)

**Status:** Specified · MVP + demo depth + **remediation built** · **Agentic discoverability** planned (ADR/spec draft)  
**Stage:** Plan ready — [agentic discoverability tasks](../tasks/feature-intelligence-agentic-discoverability.md) (gates G-A0–G-A4; Build not authorized)  
**Time box:** ~2–3 hours implementation + ~5 min demo

## Outcome

Help a product team turn **unstructured feature requests** from customers, prospects, support, and internal stakeholders into **clear, actionable product decisions**—with AI changing intake and triage, not only search UI.

## Users and jobs

| User | Job |
| --- | --- |
| **External submitter** (customer, prospect) | Share feedback in plain language; link similar ideas at confirm |
| **Internal submitter** (support, sales) | Paste notes; duplicates-first confirm |
| **Product manager** (primary demo persona) | Inline triage queue; disposition with rationale |
| **Product leader** (secondary) | Insights + optional detail audit (read-only) |

## Decided

- **Workflow:** AI **intake gate** → public discover + support → **PM triage queue** with decision briefs.
- **Personas:** External + internal submitters, PM (hero), leader; [journeys v1.3](../specs/feature-intelligence-journeys.md).
- **Home UX:** Persona router (four cards), not flat feature nav.
- **AI UX:** [Playground-aligned patterns](../specs/feature-intelligence-ai-ux-patterns.md) for web, eve, `/chat`.
- **Build order (TDD):** DB + `@repo/fi` + eve (+ evals) **before** web UI routes.
- **Demo context:** Multi-source requests (customers, prospects, support, internal)—not a single vertical SaaS fiction.
- **North-star metrics:** Decision readiness time, PM triage effort, decision capture rate; **intake link rate** for duplicates (not 7-day cohort).
- **Transparency:** Surface how grouping/evaluation was produced (rules + model steps).
- **Stack:** `apps/web`, **`@repo/fi`** domain package, **eve** root `agent/` + tools, **Postgres via `@repo/db`**, Vercel AI SDK structured output; insights UI via `@repo/ui` cards (GenUI optional).
- **Surfaces:** Human FI pages; **eve** for agent consumers; **`/chat` ask-only** (no FI tools).
- **Publish flow:** Require submitter **confirm/edit** after triage before catalog publish.
- **Duplicate retrieval:** **Lexical top-10** for assessment (no pgvector).
- **Testing:** [eve eval smoke + seed](../../docs/specs/feature-intelligence-testing.md); **web FI manual only** (no new Playwright for MVP).
- **Remediation (2026-10-25):** Merge with **supporter rollup**; AI failure non-blocking UX; discovery search/sort/pagination; domain validation; decision transparency (outcome + audit on detail); seed production guard; **behavioral** Eve evals — [remediation spec](../specs/feature-intelligence-remediation.md), [ADR 0004](../adr/0004-fi-workflow-integrity-and-safety.md).
- **Agentic discoverability (2026-10-26):** `llms.txt`, well-known MCP, Streamable HTTP `/api/mcp`, Is Agentic verification — [spec](../specs/feature-intelligence-agentic-discoverability.md), [ADR 0005](../adr/0005-fi-agentic-discoverability-and-mcp.md) (Proposed).
- **Agents:** Single eve root agent (no subagents in v1).
- **Triage:** [Jev harness](../../docs/specs/feature-intelligence-triage-harness.md) via **AI Gateway** (`AI_GATEWAY_API_KEY`, `typesafe-ai/jev`); reference `@repo/genui` gateway wiring.
- **Ask-only chat:** **Direct Anthropic** (`ANTHROPIC_API_KEY`); port Flow demo `streamText` pattern ([ADR 0010](../../.agents/flow/decisions/adr/0010-site-consultant-chat-and-mcp.md)) — [ADR 0003](../adr/0003-feature-intelligence-model-providers.md).
- **Database (Plan):** Use **one** connectivity path below; assessment default is **Path A** unless you need Neon Local branching.

## Assumed

- Single team / workspace (no multi-tenant admin) for the slice.
- No login; **source** enum on submit (customer, prospect, support, internal).
- English-only copy and models.
- Seeded via `pnpm --filter @repo/fi seed` per [seed spec](../specs/feature-intelligence-seed.md) (required for eve v1).
- Prompt collaboration log: local gitignored `prompts.txt` (shown in demo; not committed).
- Support idempotency via cookie `supporter_id`.

## Plan defaults (resolved)

- **Demo recording (direction only):** Suggested **web-only** screen path for a good assessment video—home → external thank-you → internal submit (link) → PM triage ×2 → insights refresh. Eve terminal and `/chat` are optional voiceover. **No Loom (or any recorder) integration in the app**—record externally if you submit a video.
- **Duplicates:** Lexical only; pgvector post-MVP.
- **Runtime:** Node **24+** for eve (`engines` / README); monorepo may use lower Node for web until eve commands run in Node 24 context.

## Plan — Postgres / Neon connectivity

**Rollback:** Ad-hoc `pnpm db:start` during Plan is out of scope. Configure env in **Wave 0** at **Build** authorization only.

| Path | When | `.env` | Commands (Build) |
| --- | --- | --- | --- |
| **A — Direct branch (recommended)** | Fastest for assessment; one dev/preview branch in Neon console or Vercel | `DATABASE_URL=<direct or pooled URL from Neon>` | `pnpm db:migrate` → `pnpm db:ping` → `pnpm seed:fi` |
| **B — Neon Local (Docker)** | Match Factory eval isolation; fork ephemeral branches via proxy | `NEON_API_KEY`, `NEON_PROJECT_ID`, optional `PARENT_BRANCH_ID`; omit `DATABASE_URL` to use script default | `pnpm db:start` → `pnpm db:migrate` → `pnpm db:ping` → `pnpm seed:fi` |

**Defaults (Path B only):** `packages/db/scripts/db-ping.mjs` and `db-start.mjs` assume  
`postgres://neon:npg@localhost:5432/neondb?sslmode=require` when `DATABASE_URL` is unset. Local proxy sets `DATABASE_TLS_INSECURE_LOCAL=1` automatically for localhost.

**Path A notes:** Use a **direct** (non-`-pooler`) connection for `pnpm db:migrate` if migrations fail on pooler; use pooled URL for `apps/web` at runtime if desired. Do not commit URLs.

**Path B notes:** Empty `NEON_API_KEY` / `NEON_PROJECT_ID` will fail `db:start` — fill from [Neon console](https://console.neon.tech) or use Path A instead.

**Verification gate (Wave 0):** `pnpm db:ping` exit 0; `pnpm --filter @repo/db db:check`; after seed, `list_triage_queue` smoke count **50** (demo depth).

## Plan — implementation waves (summary)

| Wave | Focus | Verification |
| --- | --- | --- |
| 0 | Env + DB path above; migrate; seed | `db:ping`, `seed:fi`, seed spec matrix |
| 1 | `@repo/fi` harness T0–T3 (gateway), CRUD, metrics tests | `pnpm --filter @repo/fi test` |
| 2 | eve tools + `evals/smoke` (AG-7) | `eve eval smoke` |
| 3 | Web persona routes + server actions | Manual W-* |
| 4 | `eve/next`, `/chat` (Anthropic), README | W-8, assessment README |

Detail: [MVP cut line](#mvp-cut-line-assessment); specs index in [feature-intelligence.md](../specs/feature-intelligence.md).

## Tasks (execution)

**Build checklist is a separate file** (specs/initiative stay stable; checkboxes update in tasks only):

→ **[docs/tasks/feature-intelligence.md](../tasks/feature-intelligence.md)** — MVP (complete).  
→ **[docs/tasks/feature-intelligence-demo-depth.md](../tasks/feature-intelligence-demo-depth.md)** — demo depth (complete).  
→ **[docs/tasks/feature-intelligence-remediation.md](../tasks/feature-intelligence-remediation.md)** — workflow remediation (complete).  
→ **[docs/tasks/feature-intelligence-agentic-discoverability.md](../tasks/feature-intelligence-agentic-discoverability.md)** — agentic discoverability + MCP (**Plan ready**).

## Non-goals

- SSO, RBAC, email notifications, full voting gamification.
- Custom prioritization rubric editor.
- Autonomous roadmap commits without PM disposition.
- Committed `prompts.txt` in public Git (Flow gitignore; attach or show in video).
- Automated Playwright coverage for FI routes (manual checklist only).
- Markdown export of decision briefs; pgvector / embeddings.

## MVP cut line (assessment)

**Ship for submission** (in order):

| Wave | Deliverable |
| --- | --- |
| 0 | DB migration + [seed](../specs/feature-intelligence-seed.md) |
| 1 | `@repo/fi` CRUD actions, full harness (T0–T3), `getInsights` + metrics tests |
| 2 | eve: **core tools** + `agent/instructions.md`; `evals/smoke` ×2+ (incl. AG-7 no auto-confirm) |
| 3 | Web: persona home → submit (contexts) → discover → detail → inline triage → insights |
| 4 | README assessment section + `pnpm qa` (**G4**); optional: `eve/next`, ask-only `/chat` |

**Cut if clock runs out** (in priority order):

1. `/chat` ask-only route
2. `eve/next` proxy (web + eve deploy convenience)
3. ~~Remaining eve tools (`confirm_request`, `support_request`)~~ — **shipped** in `agent/tools/`; optional extra smoke evals still cut-first
4. Live Jev in CI (keep deterministic T1 + degraded path; Jev on manual demo with gateway key)
5. Fourth/fifth smoke eval

**Never cut:** seed, harness, insights metrics, PM disposition, intake link on confirm, README architecture blurb.

## Success metrics

**Canonical formulas and `getInsights` contract:** [feature-intelligence.md § Product metrics (first)](../specs/feature-intelligence.md#product-metrics-first).

| Metric | Demo target | Spec enforcement |
| --- | --- | --- |
| **Decision readiness time** | Visible drop on live submit | `triage_completed_at - submitted_at`; insights avg |
| **PM triage effort** | &lt;2 min on camera | `pm_review_started_at` → `disposition_at`; insights median |
| **Decision capture rate** | ↑ after 2 dispositions (open-queue denominator) | `closed / (closed + openQueue)` on `/insights` |
| **Intake link rate** | ↑ after linked confirm | `intake_linked_request_id` on confirm |

## Validation (acceptance)

See [docs/specs/feature-intelligence.md](../specs/feature-intelligence.md).

**Domain language:** [GLOSSARY.md](../../GLOSSARY.md) (DDD ubiquitous language for this bounded context).  
**User journeys:** [feature-intelligence-journeys.md](../specs/feature-intelligence-journeys.md) (v1.3).  
**AI UX:** [feature-intelligence-ai-ux-patterns.md](../specs/feature-intelligence-ai-ux-patterns.md).

### Specification set (all accepted)

| Spec | Topic |
| --- | --- |
| [feature-intelligence.md](../specs/feature-intelligence.md) | Core behavior, metrics, IA, acceptance |
| [feature-intelligence-journeys.md](../specs/feature-intelligence-journeys.md) | Personas, UI detail, demo script (recording direction) |
| [feature-intelligence-ai-ux-patterns.md](../specs/feature-intelligence-ai-ux-patterns.md) | Progressive disclosure, progress, HITL |
| [feature-intelligence-eve-agent.md](../specs/feature-intelligence-eve-agent.md) | Tools, AG-1–AG-7 |
| [feature-intelligence-triage-harness.md](../specs/feature-intelligence-triage-harness.md) | T0–T3 |
| [feature-intelligence-seed.md](../specs/feature-intelligence-seed.md) | 500-row seed + FR-001–FR-011 anchors |
| [feature-intelligence-analytics.md](../specs/feature-intelligence-analytics.md) | Insights trends, range, charts |
| [feature-intelligence-testing.md](../specs/feature-intelligence-testing.md) | TDD + W-* + evals |
| [feature-intelligence-remediation.md](../specs/feature-intelligence-remediation.md) | Workflow gap closure (RC-1–RC-10) |
| [tasks/feature-intelligence.md](../tasks/feature-intelligence.md) | MVP execution checklist |
| [tasks/feature-intelligence-demo-depth.md](../tasks/feature-intelligence-demo-depth.md) | 500 seed + analytics (complete) |
| [tasks/feature-intelligence-remediation.md](../tasks/feature-intelligence-remediation.md) | Remediation execution (draft) |

Contracts: [PRODUCT.md](../../PRODUCT.md), [DESIGN.md](../../DESIGN.md), [ARCHITECTURE.md](../../ARCHITECTURE.md), [GLOSSARY.md](../../GLOSSARY.md), [ADR 0002](../adr/0002-feature-intelligence-architecture.md), [ADR 0003](../adr/0003-feature-intelligence-model-providers.md), [ADR 0004](../adr/0004-fi-workflow-integrity-and-safety.md).  
Research: [20261025-fi-adversarial-review.md](../research/20261025-fi-adversarial-review.md).

## Demo depth (post-MVP)

**Built 2026-10-25:** Manifest-driven **500**-row seed (`SEED_REFERENCE_ISO`, intake ~20%, merge/dup graph), queue **support sort**, `getInsights({ range })` + `/insights` trends. Checklist: [feature-intelligence-demo-depth.md](../tasks/feature-intelligence-demo-depth.md) (complete).

## Tasks (execution)

- Assessment MVP: [docs/tasks/feature-intelligence.md](../tasks/feature-intelligence.md) (complete)
- Demo depth: [docs/tasks/feature-intelligence-demo-depth.md](../tasks/feature-intelligence-demo-depth.md) (complete)

## Progress

- [x] Explore — direction and metrics agreed
- [x] Specify — initiative + full spec set + contracts updated
- [x] **Plan** — Neon paths, waves, gates, **Tasks** backlog
- [x] **Specify (demo depth)** — 500 seed + analytics specs + tasks
- [x] **Build (MVP)** — [feature-intelligence.md](../tasks/feature-intelligence.md)
- [x] **Build (demo depth)** — [feature-intelligence-demo-depth.md](../tasks/feature-intelligence-demo-depth.md)
- [x] **Explore (adversarial)** — [research](../research/20261025-fi-adversarial-review.md)
- [x] **Specify (remediation)** — [remediation spec](../specs/feature-intelligence-remediation.md) + ADR 0004
- [x] **Plan (remediation)** — [tasks](../tasks/feature-intelligence-remediation.md) (dependencies + gates)
- [ ] **Build (remediation)** — not authorized
- [ ] Review / Ship — after remediation Build
