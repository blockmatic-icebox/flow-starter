/** Public product name for SEO, JSON-LD, and agent discovery (UI brand stays hunch). */
export const fiSeoProductName = "Feature Intelligence";

export const fiSeoProductPhrase = "feature request triage";

export const fiSeoDefaultTitle = `${fiSeoProductName} — ${fiSeoProductPhrase}`;

export const fiSeoOverviewTitle = `Overview — ${fiSeoProductPhrase}`;

export const fiSeoOverviewSubtitle = `${fiSeoProductName} · Crewday demo · ${fiSeoProductPhrase}`;

export const hunchSummary =
  "Hunch helps product teams capture feedback, check duplicates, review a prioritized queue, and record decisions with rationale. This workspace uses fictional Crewday sample data—workforce scheduling for multi-location restaurants and retail. Ask Hunch generates grounded views from that feedback without mutating records from generated UI.";

export const hunchWorkspaceLabel = "Crewday — Workforce scheduling";

export const crewdayDemoNote =
  "Sample data only · fictional Crewday customer feedback";

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
  ask: "Ask questions about Crewday feedback. Generated views are read-only.",
  feedback:
    "Explore Crewday customer feedback, requests, and supporting evidence.",
  insights: "Understand recurring themes and changes in Crewday demand.",
  overview:
    "See what needs attention and how Crewday feedback is becoming decisions.",
  triage: "Review feedback and record what happens next.",
} as const;

const fiHomeSummary = `${fiSeoProductName} is ${fiSeoProductPhrase} for product teams. ${hunchSummary}`;

export const fiHomeMarkdown = `# ${fiSeoProductName} — Overview ${fiSeoProductPhrase}

${fiHomeSummary}

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
