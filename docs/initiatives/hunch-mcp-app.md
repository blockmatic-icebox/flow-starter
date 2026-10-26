# Initiative — Hunch MCP App (Meta CTO assessment)

**Status:** Wave A complete (contracts + language); Waves B–F pending implementation

**Depends on:** [feature-intelligence-agentic-discoverability.md](../specs/feature-intelligence-agentic-discoverability.md) (Streamable HTTP + eight tools **live**)

## Decided

- Keep **`POST /api/mcp`** canonical; **`POST /mcp`** remains a convenience alias.
- Preserve existing eight MCP tools and their `@repo/fi` mappings; MCP App is an **extension**, not a transport replacement.
- One focused **Hunch Explorer** iframe UI — not a second copy of the full Next.js site.
- Paper + Cobalt identity from [DESIGN.md](../../DESIGN.md); domain language from [GLOSSARY.md](../../GLOSSARY.md).
- Non-UI hosts must remain fully usable (structured + text tool results).

## Assumed

- Official [MCP Apps](https://modelcontextprotocol.io/extensions/apps/overview) extension (`@modelcontextprotocol/ext-apps` or equivalent at implementation time).
- Assessment demo stays unauthenticated on `meta-cto-two.vercel.app` for MCP read/write unless gated later.
- Eve operator remains separate from MCP callbacks (both call `@repo/fi`).

## Open

- Exact SDK version and build bundling for the iframe bundle (Webpack vs dedicated Vite entry).
- Whether `confirm_request` / `set_disposition` get optional interactive UI or stay tool-only.
- External host verification (ChatGPT Apps lab, official host utilities).

## Outcome

Agents and MCP App–capable hosts can:

1. Discover and read an interactive UI resource (e.g. `ui://hunch/explorer`).
2. Render **Signals**, **Patterns**, and **Review** presentations from tool structured content.
3. Fall back to text/structured results when the host does not load the iframe.

## Waves

| Wave | Focus                                                              |
| ---- | ------------------------------------------------------------------ |
| A    | Contract docs + glossary/design/architecture alignment             |
| B    | Register resource + MIME type; `resources/list` / `resources/read` |
| C    | Hunch Explorer React bundle + bridge wiring                        |
| D    | Tool `_meta.ui.resourceUri` associations + structured payloads     |
| E    | Eve eval isolation + workflow smoke (owned rows)                   |
| F    | Protocol verification log + optional external host pass            |

## Execution

- Spec: [hunch-mcp-app.md](../specs/hunch-mcp-app.md)
- Tasks: [hunch-mcp-app.md](../tasks/hunch-mcp-app.md)
- Verification template: [20261026-hunch-mcp-app-verification.md](../research/20261026-hunch-mcp-app-verification.md)
