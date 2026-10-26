export const hunchProductName = "hunch";

export const hunchTagline =
  "Turn customer feedback into clear product decisions.";

export const hunchSummary =
  "Hunch helps product teams capture signals, check duplicates, review a prioritized queue, and record decisions with rationale. Ask Hunch generates grounded views from your feedback data—without mutating records from generated UI.";

export const hunchWorkspaceLabel = "Demo workspace";

export const fiHomeTitle = hunchProductName;
export const fiHomeSummary = hunchSummary;

export const fiHomeMarkdown = `# ${hunchProductName}

${hunchSummary}

## Start here

- [Pulse](/) — overview of signals, themes, and decisions
- [Signals](/signals) — search published feedback
- [Add feedback](/feedback/new) — capture and publish with duplicate check
- [Review](/review) — disposition queue
- [Patterns](/patterns) — trends grounded in data
- [Ask Hunch](/ask) — generative views (read-only compose)

## Agents

- Instructions: [/llms.txt](/llms.txt)
- MCP server card: [/.well-known/mcp/server-card.json](/.well-known/mcp/server-card.json)
- MCP endpoint: POST [/api/mcp](/api/mcp) (Streamable HTTP)
`;
