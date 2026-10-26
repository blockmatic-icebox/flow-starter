import { resolveSiteOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const body = (origin: string) => `# hunch (Feature Intelligence)

> Turn unstructured feedback into clear product decisions for the Meta CTO assessment demo.

## When to use Feature Intelligence

Use this product when you need to capture customer or internal feature requests, check for duplicates before filing, run AI-assisted triage on drafts, prioritize a PM review queue, record merge/monitor/decline decisions with rationale, and report north-star outcome metrics. Agents should prefer MCP tools for structured search and triage reads; humans use the web UI at ${origin}.

## Human routes

- ${origin}/ (Pulse)
- ${origin}/signals
- ${origin}/feedback/new
- ${origin}/review
- ${origin}/patterns
- ${origin}/ask (GenUI compose — read-only)

## Agent interoperability

- Developer portal: ${origin}/developers
- OpenAPI 3.1: ${origin}/openapi.json
- MCP server card: ${origin}/.well-known/mcp/server-card.json
- MCP registry: ${origin}/.well-known/mcp.json
- Streamable HTTP MCP: ${origin}/api/mcp
- Sitemap: ${origin}/sitemap.xml
- Trust pages: ${origin}/about, ${origin}/contact, ${origin}/privacy

## Tools (MCP)

search_requests, get_request, list_triage_queue, get_insights, submit_request, confirm_request, support_request, set_disposition — all call the same @repo/fi domain layer as the Eve agent (assessment demo is open; no bearer token).
`;

export const GET = (request: Request) =>
  new Response(body(resolveSiteOrigin(request)), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
