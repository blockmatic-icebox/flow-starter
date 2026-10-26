# Tasks: MCP external access verification

**Status:** Build complete (pending deploy for `/mcp` alias on production)  
**Plan:** MCP access verification (2026-10-25)  
**Spec:** [feature-intelligence-agentic-discoverability.md](../specs/feature-intelligence-agentic-discoverability.md)

## Checklist

- [x] `/mcp` route re-export sharing `api/mcp` handler
- [x] Developers page + `fi-agent-surfaces-content` — MCP URL, Accept header, curl probes, ChatGPT vs MCP
- [x] `ARCHITECTURE.md` — canonical `meta-cto-two` production URL
- [x] Spec curl probes + `/mcp` alias note
- [x] Route-level MCP regression tests (`tests/mcp/route.test.ts`)
- [x] `fi --mcp-smoke` in `@repo/fi-cli`
- [x] Research log append — [20261026-fi-agentic-verification.md](../research/20261026-fi-agentic-verification.md)
- [ ] Deploy `meta-cto` to Vercel so `POST /mcp` is live on production (canonical `/api/mcp` already verified)

## Verification

```sh
pnpm --filter web test
AGENTIC_CHECK_URL=meta-cto-two.vercel.app pnpm --filter @repo/fi-cli exec fi --mcp-smoke
```
