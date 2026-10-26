import type { SeedRequestRow } from "../types";
import { demoContext, id, publishedRow } from "./helpers";

const tag = "permissions_compliance";

export const permissionsComplianceRows = (): SeedRequestRow[] => {
  const r8601 = publishedRow({
    daysAgo: 54,
    demoCtx: demoContext({
      orgKey: "norte-retail",
      personaKey: "tom-franchise",
    }),
    description:
      "Franchise managers should edit schedules only for their stores — corporate accidentally gave district interns full company access last month.",
    disposition: "needs_discussion",
    dispositionRationale:
      "Franchise permission model is strategic; legal + enterprise PM defining rollout.",
    problemStatement:
      "Franchisees need hard store-scoped permissions so managers cannot see other locations' comp data.",
    requestId: id("8601"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [
      { orgKey: "norte-retail", personaKey: "tom-franchise" },
      { orgKey: "norte-retail", personaKey: "lucia-hr" },
    ],
    themeKey: "permissions_compliance",
    title: "Lock managers to their own stores only",
  });

  const r8602 = publishedRow({
    daysAgo: 50,
    demoCtx: demoContext({
      orgKey: "summit-hospitality",
      personaKey: "lucia-hr",
    }),
    description:
      "California meal break: auto-block schedule that leaves <10h rest between shifts for non-exempt staff.",
    disposition: "needs_discussion",
    dispositionRationale:
      "Auto-block vs warn-only is policy decision; CA counsel reviewing defaults.",
    problemStatement:
      "HR needs automatic enforcement of minimum rest periods when building schedules.",
    requestId: id("8602"),
    scenarioTag: tag,
    source: "internal",
    supporterEntries: [
      { orgKey: "summit-hospitality", personaKey: "lucia-hr" },
    ],
    themeKey: "permissions_compliance",
    title: "Block schedules that violate rest between shifts",
  });

  const r8603 = publishedRow({
    daysAgo: 46,
    demoCtx: demoContext({ orgKey: "harbor-bites", personaKey: "lucia-hr" }),
    description:
      "Minor: let shift leads view but not edit schedules — they keep 'borrowing' manager login.",
    disposition: "decline",
    dispositionRationale:
      "Shared manager credentials are security risk; use read-only role when role ships.",
    problemStatement:
      "Shift leads need read-only schedule access without sharing manager passwords.",
    requestId: id("8603"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "harbor-bites", personaKey: "lucia-hr" }],
    themeKey: "permissions_compliance",
    title: "Read-only schedule role for shift leads",
  });

  const r8604 = publishedRow({
    daysAgo: 41,
    demoCtx: demoContext({ orgKey: "prairie-foods", personaKey: "aisha-cole" }),
    description:
      "SOC2 auditor asked who can export full employee roster with phone numbers — we can't answer from Crewday UI.",
    disposition: "monitor",
    dispositionRationale:
      "Audit export report spec in security roadmap; prairie pilot customer.",
    problemStatement:
      "Admins need permission audit report for PII export capabilities.",
    requestId: id("8604"),
    scenarioTag: tag,
    source: "prospect",
    supporterEntries: [
      { orgKey: "prairie-foods", personaKey: "aisha-cole" },
      { orgKey: "prairie-foods", personaKey: "lucia-hr" },
    ],
    themeKey: "permissions_compliance",
    title: "Audit log of who can export employee PII",
  });

  const r8605 = publishedRow({
    daysAgo: 35,
    demoCtx: demoContext({ orgKey: "coast-services", personaKey: "lucia-hr" }),
    description:
      "Crew leads shouldn't see client site security codes in job notes when viewing schedule.",
    disposition: "monitor",
    dispositionRationale:
      "Field note redaction spec in progress; single low-support strategic ask.",
    problemStatement:
      "Sensitive site credentials in job notes must be hidden from frontline roles.",
    requestId: id("8605"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "coast-services", personaKey: "lucia-hr" }],
    themeKey: "permissions_compliance",
    title: "Hide security codes from crew lead schedule view",
  });

  const r8606 = publishedRow({
    daysAgo: 28,
    demoCtx: demoContext({ orgKey: "vida-cafe", personaKey: "jen-park" }),
    description:
      "teen workers can't work past 10pm — need hard stop when dragging shifts on calendar",
    disposition: "monitor",
    dispositionRationale:
      "Minor labor rules pack shares engine with 8602; ship as compliance bundle.",
    problemStatement:
      "Minor labor rules should block illegal shift assignments at scheduling time.",
    requestId: id("8606"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "vida-cafe", personaKey: "jen-park" }],
    themeKey: "permissions_compliance",
    title: "Block illegal teen shift times on calendar",
  });

  const r8607 = publishedRow({
    daysAgo: 23,
    demoCtx: demoContext({ orgKey: "norte-retail", personaKey: "aisha-cole" }),
    description:
      "Regional can view coverage but not wages — intern role saw hourly rates last week (fixed in admin).",
    disposition: "merge",
    dispositionRationale:
      "Scoped visibility rolled into franchise permission model 8601.",
    duplicateCandidates: [
      {
        candidateRequestId: id("8601"),
        explanation: "Both about scoped access without compensation visibility",
        score: 0.68,
      },
    ],
    mergeTargetId: id("8601"),
    problemStatement:
      "Regional roles need coverage visibility without compensation fields.",
    requestId: id("8607"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "norte-retail", personaKey: "aisha-cole" }],
    themeKey: "permissions_compliance",
    title: "Regional coverage view without wage data",
  });

  const r8608 = publishedRow({
    daysAgo: 17,
    demoCtx: demoContext({
      orgKey: "summit-hospitality",
      personaKey: "tom-franchise",
    }),
    description:
      "Contractor vs employee badges on schedule — mixed workforce hotels keep scheduling contractors like FTE.",
    disposition: "needs_discussion",
    dispositionRationale:
      "Workforce type labeling affects payroll integrations; hospitality PM scoping.",
    problemStatement:
      "Schedules should distinguish contractors from employees for compliance reporting.",
    requestId: id("8608"),
    scenarioTag: tag,
    source: "prospect",
    supporterEntries: [
      { orgKey: "summit-hospitality", personaKey: "tom-franchise" },
    ],
    themeKey: "permissions_compliance",
    title: "Label contractors differently on published schedule",
  });

  const r8609 = publishedRow({
    daysAgo: 9,
    demoCtx: demoContext({ orgKey: "harbor-bites", personaKey: "sam-support" }),
    description:
      "Customer wants 2FA for anyone who can publish schedules — not related to rest rules but same security theme.",
    disposition: "monitor",
    dispositionRationale:
      "MFA on manager accounts on enterprise roadmap; track harbor enterprise deal.",
    problemStatement:
      "Schedule publishers should authenticate with MFA for enterprise customers.",
    requestId: id("8609"),
    scenarioTag: tag,
    source: "support",
    supporterEntries: [{ orgKey: "harbor-bites", personaKey: "sam-support" }],
    themeKey: "permissions_compliance",
    title: "Require MFA to publish schedules",
  });

  return [r8601, r8602, r8603, r8604, r8605, r8606, r8607, r8608, r8609];
};
