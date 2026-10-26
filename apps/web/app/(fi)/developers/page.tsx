import Link from "next/link";

import {
  fiDevelopersIntro,
  fiProductTagline,
} from "@/lib/fi-agent-surfaces-content";

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
          demo host)
        </li>
        <li>
          <code>POST /api/chat</code> — ask-only streaming chat (no tools)
        </li>
      </ul>
      <h2>Sandbox</h2>
      <p>
        This deployment is the assessment sandbox: seeded data, no API keys
        required for MCP on the public alias. Use <code>search_requests</code>{" "}
        with query <code>CSV</code> to verify connectivity against seeded rows
        FR-001 and FR-002.
      </p>
      <h2>Human docs</h2>
      <p>
        <Link href="/about">About</Link> · <Link href="/contact">Contact</Link>{" "}
        · <Link href="/privacy">Privacy</Link>
      </p>
    </article>
  );
}
