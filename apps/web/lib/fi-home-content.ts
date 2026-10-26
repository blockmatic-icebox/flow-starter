export const fiHomeTitle = "Feature Intelligence";

export const fiHomeSummary =
  "Feature Intelligence turns unstructured product feedback into clear decisions. Product managers and researchers capture customer and internal signals, run AI-assisted triage on new drafts, review a prioritized queue, and record merge, monitor, decline, or needs-discussion dispositions with rationale. Stakeholders can search published requests, add support, and read outcome metrics on the insights dashboard. The assessment demo ships without end-user login so agents and humans can exercise the same workflows via the web UI, Eve tools, or the public Streamable HTTP MCP endpoint.";

export const fiHomeMarkdown = `# ${fiHomeTitle}

${fiHomeSummary}

## Start here

- [Share feedback](/requests/new?context=external) — external customer voice
- [Log customer feedback](/requests/new?context=internal) — internal notes with duplicate check
- [Review queue](/triage) — PM disposition workflow
- [See outcomes](/insights) — north-star metrics
- [Browse requests](/requests) — search and sort published items
- [Ask FI chat](/chat) — read-only assistant

## Agents

- Instructions: [/llms.txt](/llms.txt)
- MCP server card: [/.well-known/mcp/server-card.json](/.well-known/mcp/server-card.json)
- MCP endpoint: POST [/api/mcp](/api/mcp) (Streamable HTTP)
`;
