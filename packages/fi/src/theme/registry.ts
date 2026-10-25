export const themeRegistry = {
  collaboration_sharing: {
    description: "Sharing, comments, co-editing, external viewers",
    keywords: ["share", "comment", "collaborat", "co-edit", "external"],
    label: "Collaboration & sharing",
  },
  integrations_alerts: {
    description: "Slack, PagerDuty, webhooks, mobile push",
    keywords: [
      "slack",
      "alert",
      "pagerduty",
      "webhook",
      "push",
      "notification",
    ],
    label: "Integrations & alerts",
  },
  platform_other: {
    description: "Cross-cutting infra, perf, admin",
    keywords: [],
    label: "Platform / other",
  },
  reporting_exports: {
    description: "CSV, PDF, scheduled reports, dashboards export",
    keywords: ["csv", "export", "download", "pdf", "report", "dashboard"],
    label: "Reporting & exports",
  },
} as const;

export type ThemeKey = keyof typeof themeRegistry;

export const themeLabelForKey = (key: ThemeKey) => themeRegistry[key].label;
