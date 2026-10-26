export const hunchProductName = "hunch";

export const hunchTagline =
  "Turn customer feedback into clear product decisions.";

export const hunchSummary =
  "Hunch helps product teams capture feedback, check duplicates, review a prioritized queue, and record decisions with rationale. Ask Hunch generates grounded views from your feedback data—without mutating records from generated UI.";

export const hunchWorkspaceLabel = "Demo workspace";

export const hunchNav = {
  ask: { href: "/ask", label: "Ask Hunch" },
  dev: { href: "/dev", label: "Developer overview" },
  feedback: { href: "/signals", label: "Feedback" },
  insights: { href: "/patterns", label: "Insights" },
  overview: { href: "/", label: "Overview" },
  triage: { badge: true, href: "/review", label: "Triage" },
} as const;

export const hunchPageSubtitles = {
  addFeedback: "Capture customer feedback in plain language.",
  ask: "Ask questions about your feedback data. Generated views are read-only.",
  feedback: "Explore customer feedback, requests, and supporting evidence.",
  insights: "Understand recurring themes and changes in demand.",
  overview: "See what needs attention and how feedback is becoming decisions.",
  triage: "Review feedback and record what happens next.",
} as const;

export const fiHomeTitle = hunchProductName;
export const fiHomeSummary = hunchSummary;

export const fiHomeMarkdown = `# ${hunchProductName}

${hunchSummary}

## Start here

- [Overview](/) — needs attention, metrics, and recent decisions
- [Feedback](/signals) — search published feedback
- [Add feedback](/feedback/new) — capture and publish with duplicate check
- [Triage](/review) — review queue and record decisions
- [Insights](/patterns) — trends grounded in data
- [Ask Hunch](/ask) — generative views (read-only compose)
- [Developer overview](/dev) — MCP and API discovery

## Agents

- Instructions: [/llms.txt](/llms.txt)
- MCP server card: [/.well-known/mcp/server-card.json](/.well-known/mcp/server-card.json)
- MCP endpoint: POST [/api/mcp](/api/mcp) (Streamable HTTP)
`;
