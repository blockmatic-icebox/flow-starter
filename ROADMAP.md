# Flow — Implementation Roadmap

> Updated October 18, 2026. [PRODUCT.md](PRODUCT.md) owns scope and acceptance. The initial release proves a reusable shared-action pattern through the repository explorer; follow-on capabilities do not block it.

Preserve the monorepo and chosen stack. Label fixtures and incomplete integrations. Close each step with evidence before expanding scope.

## 1. Validate the foundation

Prove eve, Next.js, Better Auth, and Neon/Drizzle together in a Vercel preview. Verify identity propagation, streaming, cancellation, resumption, persistence, and cross-user rejection. Inspect the effective tool inventory; exclude broad shell, filesystem, and self-modification capabilities.

Establish lint/format, types, build, and relevant behavior checks in CI. Document actual setup and environment requirements. Keep production data and secrets out of previews.

## 2. Build the workspace and execution feedback

Implement `/dev` with “What do you want to explore?”, editable suggestions, right-side chat, mobile tabs, and theme support. Use fixture-driven state views before connecting real events. Show selection context near the composer, citations with claims, and concrete activity labels.

Accept when keyboard and reduced-motion behavior work; real chat shows submission, activity, completion, cancellation, and uncertain connectivity. A text-only answer does not alter the canvas. Disabling the example also rejects its endpoints without disabling shared application auth.

## 3. Complete one shared-action slice

Start with a bounded module-table fixture and a filter action. Both the UI adapter and eve tool call the same authorized operation. Implement owner-scoped persistence, confirmed snapshots, versions, and idempotent retries before broadening the catalog.

Accept when a manual filter is visible to the agent, a chat filter is visible to the UI, reload restores the result, and replay/conflicts cannot duplicate effects or silently overwrite state. Domain operations must not depend on `/dev` or repository-explorer presentation.

## 4. Ground the repository explorer and generate artifacts

Add bounded retrieval of the configured public repository and documentation, with revision-aware citations. Publish Fumadocs, Markdown, and `llms.txt` from shared editorial sources. Start the json-render catalog with text, tables, and Mermaid diagrams.

Accept when the architecture walkthrough in PRODUCT works with real sources. Selection identifies a module; authorization answers cite code or disclose missing evidence. Validate specs and dataset references before commit. Preserve the previous artifact after invalid output, failure, or cancellation.

Test unavailable sources, stale/conflicting evidence, prompt injection, invalid specs, and user isolation. Keep dependency comparisons, charts, and videos outside this checkpoint.

## 5. Prove adoption and initial release

Write the extension guide against implemented files: define one operation, validate and authorize it, persist its result, expose UI and agent adapters, and test both paths. Explain what to keep, configure, and replace. Have a fresh adopter run the example and add a custom shared action; record the time and obstacles.

Document model/instruction configuration, sanitized activity inspection, and evaluation reruns. Maintain a small versioned evaluation set covering grounded answers, unsupported claims, valid specs, and authorized actions. Run deterministic checks in CI and a bounded live evaluation for release.

Complete accessibility, preview smoke tests, controlled migrations, release, and recovery rehearsal. Report measured latency and consumption. Initial release acceptance is PRODUCT's six-step demonstration; avoid production-ready claims until that validation passes.

## Follow-on work

Prioritize from adopter needs after the initial demonstration works:

- External invocation: authenticate scoped machine credentials, return cited answers and validated specs, and prove read-only access and isolation from browser canvases.
- Voice: prove identity, conversation continuity, grounded speech, exactly one action execution, interruption, reconnection, and usage limits through eve delegation.
- Broader exploration: add dependency ownership/contribution evidence, charts/metrics, or curated videos only for concrete questions.

Existing architecture contracts govern these additions. A failed expansion does not invalidate the initial release or justify silently replacing the chosen stack. MCP, ChatGPT, and Slack adapters are not initial-release requirements.
