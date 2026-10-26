import Link from "next/link";

import {
  fiDevelopersIntro,
  fiMcpCanonicalUrl,
  fiMcpClientGuidance,
  fiMcpConnectionSummary,
  fiProductTagline,
} from "@/lib/fi-agent-surfaces-content";

const mcpInitializeCurl = `curl -sS -X POST '${fiMcpCanonicalUrl}' \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json, text/event-stream' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"your-client","version":"1.0.0"}}}'`;

const mcpToolsListCurl = `curl -sS -X POST '${fiMcpCanonicalUrl}' \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json, text/event-stream' \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'`;

const mcpSearchCurl = `curl -sS -X POST '${fiMcpCanonicalUrl}' \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json, text/event-stream' \\
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_requests","arguments":{"query":"CSV","limit":3}}}'`;

export default function DevelopersPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-3xl">
      <h1>Developers</h1>
      <p className="lead">{fiProductTagline}</p>
      <p>{fiDevelopersIntro}</p>
      <h2>Quickstart</h2>
      <ol>
        <li>
          Read agent instructions at <Link href="/llms.txt">/llms.txt</Link>.
        </li>
        <li>
          Load the OpenAPI document at{" "}
          <Link href="/openapi.json">/openapi.json</Link>.
        </li>
        <li>
          Connect MCP clients to <code>POST /api/mcp</code> (Streamable HTTP).
          Server card:{" "}
          <Link href="/.well-known/mcp/server-card.json">
            /.well-known/mcp/server-card.json
          </Link>
          .
        </li>
        <li>
          Install the workspace CLI:{" "}
          <code>pnpm --filter @repo/fi-cli exec fi --help</code> (see package
          README for publish targets).
        </li>
      </ol>
      <h2>MCP connection</h2>
      <p>{fiMcpConnectionSummary}</p>
      <p>{fiMcpClientGuidance}</p>
      <h3>Smoke probes (curl)</h3>
      <p>Initialize:</p>
      <pre>
        <code>{mcpInitializeCurl}</code>
      </pre>
      <p>List tools:</p>
      <pre>
        <code>{mcpToolsListCurl}</code>
      </pre>
      <p>
        Read-only tool call (<code>search_requests</code>):
      </p>
      <pre>
        <code>{mcpSearchCurl}</code>
      </pre>
      <h2>API catalog</h2>
      <ul>
        <li>
          <Link href="/api">GET /api</Link> — JSON index of HTTP entrypoints
        </li>
        <li>
          <Link href="/openapi.json">GET /openapi.json</Link> — OpenAPI 3.1
        </li>
        <li>
          <code>POST /api/mcp</code> — MCP tools (search, triage, mutations on
          demo host); alias <code>POST /mcp</code>
        </li>
        <li>
          <code>POST /api/chat</code> — ask-only streaming chat (no tools)
        </li>
      </ul>
      <h2>Sandbox</h2>
      <p>
        This deployment is the assessment sandbox: seeded data, no API keys
        required for MCP on the public alias. Use <code>search_requests</code>{" "}
        with argument <code>query: &quot;CSV&quot;</code> to verify connectivity
        against seeded export rows.
      </p>
      <h2>Human docs</h2>
      <p>
        <Link href="/about">About</Link> · <Link href="/contact">Contact</Link>{" "}
        · <Link href="/privacy">Privacy</Link>
      </p>
    </article>
  );
}
