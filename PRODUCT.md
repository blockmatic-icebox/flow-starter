# Flow — Product

> Confirmed direction · October 18, 2026. Designed, not implemented. This document owns product scope and acceptance. [DESIGN.md](DESIGN.md) owns presentation, [ARCHITECTURE.md](ARCHITECTURE.md) owns technical boundaries, and [ROADMAP.md](ROADMAP.md) sequences delivery. Vocabulary lives in [GLOSSARY.md](GLOSSARY.md); architectural decisions live in [docs/adr/](docs/adr/).

## Purpose

**Flow is an open-source, opinionated starter for agentic apps built with Vercel technology. It demonstrates how people and agents share actions, context, and persistent state through an interactive workspace.**

The included repository explorer teaches the pattern. Developers replace its tools, data, and views with their own domain. The starter should make the first custom shared action understandable, testable, and deployable without introducing a framework.

## Users and jobs

| User | Job Flow supports |
| --- | --- |
| App developer | Reuse the foundation and replace the example with a domain capability. |
| Developer running agent experiments | Change instructions or models, inspect execution, and rerun a bounded evaluation. |
| Developer evaluating the starter | Trace one request through retrieval, tools, authorization, persistence, and UI. |

The primary adoption milestone is a developer adding one operation that both a UI control and the agent can invoke, with the same authorization and persisted result.

## Initial release

Ship one complete path: authenticated conversation → grounded repository exploration → validated artifact → shared UI/agent updates → recovery after reload.

- Preserve Next.js, Turborepo, eve, Vercel AI SDK through eve, Better Auth, Neon/Drizzle, and the existing Base UI component foundation.
- Use one agent and a small shared action layer. Keep domain operations independent of the example route and transport.
- Start the json-render catalog with text, tables, and Mermaid architecture diagrams. Components use authored tokens and approved actions.
- Retrieve bounded documentation and source from one configured public repository. Cite the inspected revision and disclose unavailable evidence.
- Persist user-owned conversations and artifacts. UI and agent actions operate on the same confirmed state.
- Show real execution activity, cancellation, partial results, errors, and recovery from the first agent integration.
- Include reproducible setup, automated checks, isolated preview validation, deployment, and recovery instructions.
- Document model and instruction configuration, sanitized execution diagnostics, and a small versioned evaluation set.

The existing checkout remains a baseline. These requirements do not establish implemented capabilities.

## Repository explorer at `/dev`

Keep `/dev` separate from the application an adopter builds at `/`. The example may remain as a development companion or be disabled together with its agent endpoints. Shared auth and reusable actions must not depend on the example remaining enabled.

The empty canvas asks **“What do you want to explore?”** Suggested requests fill an editable draft:

1. Show how a request moves through this app.
2. Where is authorization enforced?
3. Explain how the UI and agent share an action.
4. Show how this starter is tested and deployed.

The prompt and right-side chat use the same conversation. Chat answers questions; the canvas holds a visual result when useful. Text-only answers leave the canvas unchanged. Selection context stays visible near the composer, and citations appear beside supported claims.

All example interactions remain at `/dev`; conversation and artifact IDs are internal. Reload restores the selected conversation without generating another artifact. Mobile uses Chat/Canvas tabs that retain state. Public documentation remains accessible; agent use and private canvases require GitHub sign-in.

Generation shows concrete activity such as “Building architecture view.” Keep the previous valid artifact visible during updates. Sorting and filtering use actions without regenerating the UI spec. The canvas is a results surface, not an editor or published website.

## Acceptance demonstration

1. Sign in and ask “Show how a request moves through this app.” Receive a source-backed diagram and module table while remaining at `/dev`.
2. Select a module and ask “Where is authorization enforced here?” The agent uses the validated selection and cites actual code, or identifies missing evidence.
3. Filter or sort the table through direct controls, then ask what is visible. The agent describes the confirmed view. Request a supported filter through chat and verify both paths use the same action.
4. Reload and recover the artifact without a model call. Verify another user cannot read it; retries do not duplicate effects; conflicts and failed sources remain explicit.
5. Follow the extension guide to add a domain operation with an input schema, permissions, persistence, UI adapter, agent tool, and meaningful behavior test. Verify both entry points produce the same result.
6. Run the documented checks, bounded evaluation, preview smoke test, deployment, and recovery procedure from a fresh setup.

Fixtures support development and deterministic tests; label them explicitly. Release acceptance uses real integrations. Do not describe planned code paths as implemented.

## Adoption and experimentation

Documentation must distinguish what to keep, configure, and replace. Keep identity, validation, action execution, persistence, and recovery. Configure credentials, model, instructions, and repository. Replace repository-specific tools, data, prompts, and views as the adopter's domain requires.

Provide one end-to-end extension guide when the action implementation exists; cite actual files and commands. Do not create a generic SDK, CLI, plugin system, or experiment dashboard. Keep model and instruction configuration discoverable and evaluations versioned. Record latency, errors, and consumption without storing secrets or unnecessary private content.

Measure time to first successful run and first custom shared action with fresh adopters. Report observations without inventing targets or claiming production readiness before validation.

## Follow-on capabilities

Voice, external coding-agent invocation, dependency maintainer/contributor exploration, charts/metrics, and curated video remain possible expansions. None blocks initial release acceptance or requires speculative adapters in the foundation.

When implemented, voice delegates domain work to eve and shares authorized actions. External invocation remains read-only for browser canvases with scoped machine credentials. Existing ADRs preserve these boundaries; their detailed contracts apply when each capability is implemented.

Add an expansion only with a concrete adopter task and its own validated demonstration. Keep charts tied to real datasets, maintainer claims tied to explicit ownership records, and video metadata tied to verified sources.

## Evidence and boundaries

Distinguish implementation, documented intent, and proposals. Identify repository revisions; disclose stale, unavailable, partial, or conflicting evidence. Code establishes observed behavior; documents explain intent. Missing evidence is unknown, never an invented result or a zero value.

Generated UI composes approved components; it never executes arbitrary model-generated JavaScript, React, SQL, or URLs. Scope excludes arbitrary/private repository ingestion, repository mutations, payments, organizations, teams, an IDE or terminal, generated websites, publishing, simultaneous collaboration, and a generic agent framework.
