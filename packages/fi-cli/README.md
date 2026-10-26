# feature-intelligence-cli

Official npm CLI for Feature Intelligence agent discovery (Meta CTO assessment demo).

```bash
npx feature-intelligence-cli
npx feature-intelligence-cli --openapi
AGENTIC_CHECK_URL=meta-cto-two.vercel.app npx feature-intelligence-cli --mcp-smoke
```

`--mcp-smoke` runs Streamable HTTP `initialize` and `tools/list` against `https://<host>/api/mcp` with the required `Accept: application/json, text/event-stream` header.

Workspace development:

```bash
pnpm --filter feature-intelligence-cli exec fi
```
