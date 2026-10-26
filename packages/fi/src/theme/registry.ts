export const themeRegistry = {
  collaboration_sharing: {
    description: "Sharing, comments, co-editing, external viewers",
    keywords: ["share", "comment", "collaborat", "co-edit", "external"],
    label: "Collaboration & sharing",
  },
  data_governance: {
    description: "Retention, audit, lineage, compliance",
    keywords: ["governance", "audit", "retention", "compliance"],
    label: "Data governance",
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
  mobile_experience: {
    description: "Mobile dashboards, push, responsive layouts",
    keywords: ["mobile", "ios", "android", "responsive"],
    label: "Mobile experience",
  },
  performance_scale: {
    description: "Query speed, large datasets, concurrency",
    keywords: ["slow", "performance", "scale", "latency"],
    label: "Performance & scale",
  },
  permissions_access: {
    description: "RBAC, row-level security, sharing policies",
    keywords: ["permission", "rbac", "access", "role"],
    label: "Permissions & access",
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
