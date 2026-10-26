export const themeRegistry = {
  availability_time_off: {
    description: "Recurring availability, PTO, leave approvals",
    keywords: [
      "time off",
      "pto",
      "vacation",
      "availability",
      "leave",
      "student",
      "part-time",
    ],
    label: "Availability & time off",
  },
  mobile_reliability: {
    description: "Offline access, crashes, slow networks, older devices",
    keywords: [
      "offline",
      "crash",
      "iphone",
      "android",
      "slow",
      "3g",
      "wifi",
      "mobile",
    ],
    label: "Mobile & reliability",
  },
  notifications: {
    description: "Schedule change alerts, push, SMS, missed updates",
    keywords: [
      "notification",
      "alert",
      "push",
      "sms",
      "didn't know",
      "missed",
      "aviso",
      "turno",
      "horario",
    ],
    label: "Notifications",
  },
  permissions_compliance: {
    description: "Manager scopes, franchise access, rest periods, policy",
    keywords: [
      "permission",
      "franchise",
      "compliance",
      "rest period",
      "break",
      "hr",
      "role",
      "access",
    ],
    label: "Permissions & compliance",
  },
  platform_other: {
    description: "Cross-cutting infra or uncategorized feedback",
    keywords: [],
    label: "Platform / other",
  },
  reporting_operations: {
    description: "Multi-location coverage visibility and ops reporting",
    keywords: [
      "regional",
      "coverage",
      "across stores",
      "locations",
      "visibility",
      "dashboard",
      "rollup",
    ],
    label: "Reporting & operations",
  },
  scheduling_coverage: {
    description: "Finding replacements, sick calls, coverage gaps",
    keywords: [
      "coverage",
      "sick",
      "call out",
      "replacement",
      "understaffed",
      "shift",
      "schedule",
    ],
    label: "Scheduling & coverage",
  },
  shift_swaps: {
    description: "Shift trades, approvals, synchronization",
    keywords: [
      "swap",
      "trade",
      "cover",
      "approval",
      "manager approve",
      "closing shift",
    ],
    label: "Shift swaps",
  },
  time_tracking_payroll: {
    description: "Overtime, payroll exports, labor correctness",
    keywords: [
      "payroll",
      "overtime",
      "export",
      "hours",
      "timesheet",
      "cutoff",
      "labor",
    ],
    label: "Time tracking & payroll",
  },
} as const;

export type ThemeKey = keyof typeof themeRegistry;

export const themeLabelForKey = (key: ThemeKey) => themeRegistry[key].label;
