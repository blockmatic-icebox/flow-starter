export const fiProductTagline =
  "Product feature request triage for teams capturing feedback, running AI-assisted intake, and recording PM dispositions with measurable outcomes.";

export const fiDevelopersIntro = `Feature Intelligence exposes a Streamable HTTP MCP server, OpenAPI 3.1 description, and ask-only chat for agents and integrators. The assessment demo on meta-cto-two runs without end-user login; mutation tools are open on the public host for demonstration only. Production adopters must gate writes behind authentication per Factory security guidance.`;

export const fiMcpCanonicalUrl = "https://meta-cto-two.vercel.app/api/mcp";

export const fiMcpConnectionSummary = `Canonical MCP URL: ${fiMcpCanonicalUrl} (Streamable HTTP, JSON-RPC over POST). Convenience alias: POST /mcp on the same host reuses the same handler; discovery documents list /api/mcp only. No bearer token on the public assessment alias. Required request headers: Content-Type: application/json and Accept: application/json, text/event-stream — clients that send Accept: application/json alone receive HTTP 406. MCP tools call @repo/fi directly (same validation as in-repo Eve tools); they do not use Eve HTTP sessions at /eve/v1.`;

export const fiMcpClientGuidance = `MCP-capable clients (Cursor, Claude Desktop, MCP Inspector, custom hosts): configure a remote HTTP MCP server with URL ${fiMcpCanonicalUrl} and the Accept header above. ChatGPT or other products that offer a separate “connector” or GPT action flow are not the same as pasting the site homepage — you must add a remote MCP server entry when the product supports Streamable HTTP MCP. OpenAPI at /openapi.json documents tool schemas for function-calling; live invocation uses POST /api/mcp.`;

export const fiMcpPublicHostGuidance = `Use host meta-cto-two.vercel.app only for unauthenticated MCP and discovery. The default team URL meta-cto-gaboesquivel.vercel.app is behind Vercel Deployment Protection and returns HTTP 401 for MCP POST without a bypass — do not use it for external agent smoke tests.`;

export const fiMcpExternalAuditorGuidance = `External auditors (e.g. automated assessment agents): DNS must resolve meta-cto-two.vercel.app before any curl or MCP client will work — “Could not resolve host” is a client network issue, not application downtime. Vercel connector HTTP 403 on deployment protection-bypass or alias admin APIs indicates the connector identity lacks team API permission; it does not prove POST /api/mcp is broken. Validate MCP with direct HTTPS to ${fiMcpCanonicalUrl} and the Accept header in fiMcpConnectionSummary.`;

export const aboutBody = `Feature Intelligence is a Meta CTO assessment product built on Flow Factory. It helps product managers and researchers turn unstructured customer, prospect, support, and internal feedback into published feature requests with duplicate detection, AI-assisted triage, a prioritized review queue, and disposition workflows (merge, monitor, decline, needs discussion) backed by rationale and north-star metrics on the insights dashboard.

The web application serves human personas through a home router, discover and support flows, inline triage, and an ask-only chat that does not mutate domain data. Automation uses the same @repo/fi domain layer through Eve tools in the repository or through the public MCP endpoint on this deployment. Agents should read /llms.txt for when-to-use guidance and /.well-known/mcp/server-card.json for transport metadata.

This demo intentionally omits SSO and multi-tenant administration so evaluators can exercise end-to-end workflows quickly. Data is seeded for narrative demos and is not production customer data.`;

export const contactBody = `For the Meta CTO technical assessment, Feature Intelligence is operated as a public demo deployment. Product questions about scope and acceptance criteria belong to the assessment brief; engineering questions about Flow Factory belong to the flow-factory repository.

Agent integrators can verify live behavior with GET /openapi.json, POST /api/mcp (Streamable HTTP), and the developer overview at /dev. For API errors, clients receive JSON bodies with code, error, and resolution fields. Human visitors can use the in-app Ask chat at /chat when ANTHROPIC_API_KEY is configured on the host.

Assessment contact for the deploying organization should be listed in your submission materials; this page exists so automated trust checks can confirm a reachable contact narrative on the same origin as the product.`;

export const privacyBody = `Feature Intelligence assessment demo processes feature request text, triage metadata, support counts, and disposition records in Postgres when DATABASE_URL is configured. The demo does not implement end-user accounts; supporter identity may use a browser cookie key for idempotent support actions.

Model providers: triage harness calls may use Vercel AI Gateway when configured; ask-only chat uses Anthropic when ANTHROPIC_API_KEY is present. Prompts and customer text should not be treated as confidential production data on this public host.

Public MCP on /api/mcp exposes read and write tools without bearer tokens for the assessment only. Do not submit regulated personal data. Logs follow the host platform retention policy. For production deployments, adopters must replace open MCP with authenticated, rate-limited access and publish their own privacy policy.`;
