import type { Metadata } from "next";
import Link from "next/link";

import {
  fiDevelopersIntro,
  fiMcpCanonicalUrl,
  fiMcpClientGuidance,
  fiMcpConnectionSummary,
  fiMcpExternalAuditorGuidance,
  fiMcpPublicHostGuidance,
  fiProductTagline,
} from "@/lib/fi-agent-surfaces-content";
import { hunchNav } from "@/lib/hunch-content";
import { fiMcpAppResourceUri } from "@/lib/mcp/tool-catalog";

import { CopyMcpUrl } from "./copy-mcp-url";

export const metadata: Metadata = {
  title: hunchNav.dev.label,
};

const mcpInitializeCurl = `curl -sS -X POST '${fiMcpCanonicalUrl}' \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json, text/event-stream' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"your-client","version":"1.0.0"}}}'`;

export default function DevPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-3xl">
      <h1>{hunchNav.dev.label}</h1>
      <p className="text-muted-foreground not-prose text-sm">
        Connect agents and integrators to the same Feature Intelligence domain
        layer as the human UI.
      </p>
      <p>{fiProductTagline}</p>
      <p>{fiDevelopersIntro}</p>
      <h2>MCP endpoint</h2>
      <p>{fiMcpConnectionSummary}</p>
      <CopyMcpUrl url={fiMcpCanonicalUrl} />
      <p className="text-sm">{fiMcpClientGuidance}</p>
      <h2>Discovery</h2>
      <ul>
        <li>
          <Link href="/llms.txt">/llms.txt</Link> — agent instructions
        </li>
        <li>
          <Link href="/openapi.json">/openapi.json</Link> — OpenAPI 3.1
        </li>
        <li>
          <Link href="/.well-known/mcp/server-card.json">
            /.well-known/mcp/server-card.json
          </Link>
        </li>
        <li>
          <code>POST /api/mcp</code> — Streamable HTTP tools (same validation as
          in-repo Eve)
        </li>
      </ul>
      {fiMcpAppResourceUri ? (
        <p>
          MCP Apps: <code>{fiMcpAppResourceUri}</code> via{" "}
          <code>resources/read</code>.
        </p>
      ) : null}
      <h3>Public host</h3>
      <p>{fiMcpPublicHostGuidance}</p>
      <h3>External auditors</h3>
      <p>{fiMcpExternalAuditorGuidance}</p>
      <h3>Initialize (curl)</h3>
      <pre>
        <code>{mcpInitializeCurl}</code>
      </pre>
      <h2>Human product</h2>
      <p>
        <Link href="/">Overview</Link> · <Link href="/ask">Ask Hunch</Link> ·{" "}
        <Link href="/about">About</Link>
      </p>
    </article>
  );
}
