# Browser verification

Use the installed **agent-browser** skill ([`skills-lock.json`](../../skills-lock.json) → `vercel-labs/agent-browser`). Install or refresh project skills with `pnpm skills:install`. Before any CLI commands, load the workflow from the tool:

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
| Portless (default) | `https://flow.localhost` |
| Direct Next dev | `http://localhost:3000` (or the port shown in the terminal) |

Use HTTPS on `flow.localhost` when certificate trust is set up (`pnpm setup:portless`). Fall back to direct `dev:app` only when Portless or TLS blocks the CLI. Leave TLS verification enabled.

GenUI fixture lab routes (`/__genui__/fixtures/:id`) require `GENUI_FIXTURE_LAB=1` on the server. Playwright sets this automatically; for manual or agent-browser passes against fixtures, run Next with that env or use `pnpm test:browser` for automated coverage.

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

## Next.js runtime diagnostics

When behavior is unclear (RSC boundaries, caching, server errors), use `pnpm mcp:next` with the dev server running, then confirm the fix in the browser.

## Done when

The affected flows were exercised in a real browser, related routes were checked, automated tests that match the change were run, and the report names the **session id**, **base URL**, and what **snapshot**, **screenshot**, **errors**, and **console** showed—or states that agent-browser was unavailable.
