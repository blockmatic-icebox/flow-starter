# Browser verification

Use the installed **agent-browser** skill ([`.agents/skills-lock.json`](../../skills-lock.json) → `vercel-labs/agent-browser`). Install or refresh project skills with `pnpm --dir .agents skills:install`. Before any CLI commands, load the workflow from the tool:

```bash
agent-browser skills get core
```

For a broader UI pass (layout, flows, edge cases not covered by Playwright), also load:

```bash
agent-browser skills get dogfood
```

## Base URL

Start the app with `pnpm dev` (Portless) or `pnpm --filter web dev:app` (direct Next).

| Mode | URL |
| --- | --- |
| Portless (default) | `https://<name>.localhost` from `apps/web/package.json` → `portless.name` (template default: `web`) |
| Direct Next dev | `http://localhost:3000` (or the port shown in the terminal) |

Use HTTPS on the Portless hostname when certificate trust is set up (`pnpm setup:portless`). Fall back to direct `dev:app` only when Portless or TLS blocks the CLI. Leave TLS verification enabled.

When the product adds GenUI fixture or lab routes, document the required env vars in the product app and cover them in `pnpm test:browser` where appropriate.

## Session

```bash
export AGENT_BROWSER_SESSION="$(agent-browser session id --scope worktree --prefix <task>)"
```

Use one session per task or worktree. Do not reuse another agent’s session without cause.

## What to do

1. Open every route and interaction affected by the change (and closely related routes that share state).
2. **Snapshot** for structure (accessibility tree / refs).
3. **Screenshot** when layout, spacing, or visual hierarchy matter.
4. Check **`errors`** and **`console`** for runtime failures.
5. Exercise keyboard focus and at least one narrow viewport when the change touches layout or forms.
6. Run matching automated checks (`pnpm test`, `pnpm test:browser` when GenUI or shell UI changed).
7. Fix issues and re-verify.

If agent-browser is not installed or the CLI fails, say so explicitly. Do not claim browser verification from typecheck or unit tests alone.

Do not commit screenshots or other local browser artifacts.

## Playwright vs agent-browser

| Tool | Role |
| --- | --- |
| **Playwright** (`pnpm test:browser`) | Repeatable regression gates; fixture lab and shell smokes. |
| **agent-browser** | Exploratory verification while implementing; catches gaps specs do not cover yet. |

Both can apply to the same change. Report them separately: command output for Playwright, session URL and snapshot/screenshot/console findings for agent-browser.

When Playwright flakes with `net::ERR_ABORTED` against `localhost`, stop stray dev servers on the Playwright port (`PLAYWRIGHT_PORT`, default `3198`) and rerun with `CI=true` so `reuseExistingServer` does not attach to a dying process. `@repo/ui` `Button` with `render={<Link />}` exposes **button** role in the accessibility tree—prefer `getByRole("button", { name })` or navigate by URL in specs.

## Next.js runtime diagnostics

When behavior is unclear (RSC boundaries, caching, server errors), use `pnpm mcp:next` with the dev server running, then confirm the fix in the browser.

## Is Agentic (optional deploy gate)

When a deployment exposes public agent surfaces (MCP, `llms.txt`, Markdown negotiation on `/`), run the [Is Agentic](https://is-agentic.com/docs) audit against the live host:

```sh
AGENTIC_CHECK_URL=<host-without-scheme> pnpm agentic:check
```

`pnpm agentic:check` without `AGENTIC_CHECK_URL` exits with an error; set a deployed public host (no `https://` prefix).

Factory scope and adoption patterns: [MCP discoverability initiative](../initiatives/mcp-discoverability.md). Product-specific agentic requirements live in `docs/specs/` and `docs/adr/` separately. Flow Factory only provides the CLI hook.

The root script uses the `is-agentic` devDependency. It returns the latest stored report for that host; it does not force a rescan. After material deploy changes, open the host report on [is-agentic.com](https://is-agentic.com) and use **Rescan**, then rerun `pnpm agentic:check`.

## Product readiness vs methodology eval

- **Flow methodology** (`pnpm --dir .agents eval run`, gates, official eligible) measures agent behavior against scenario cards. It does not by itself prove product quality.
- **Product readiness** (`pnpm eval:readiness`, `pnpm eval:stress`) uses allowlisted commands and writes evidence under `__dev/product-evals/`. Engineering, feature, and usability dimensions are reported separately; `READY` requires observed evidence for release-blocking criteria.
- Automated browser checks support usability verification; they are not a substitute for human usability validation.

## Done when

The affected flows were exercised in a real browser, related routes were checked, automated tests that match the change were run, and the report names the **session id**, **base URL**, and what **snapshot**, **screenshot**, **errors**, and **console** showed—or states that agent-browser was unavailable.
