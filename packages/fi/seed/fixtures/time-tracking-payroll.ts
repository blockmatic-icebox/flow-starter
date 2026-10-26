import type { SeedRequestRow } from "../types";
import { demoContext, id, publishedRow } from "./helpers";

const tag = "payroll_discrepancies";

const payrollCanonicalId = id("8501");

export const timeTrackingPayrollRows = (): SeedRequestRow[] => {
  const r8501 = publishedRow({
    daysAgo: 56,
    decisionBrief:
      "Payroll cutoff defect — canonical for merge cluster; Derek's weekly reconciliation.",
    demoCtx: demoContext({
      orgKey: "harbor-bites",
      personaKey: "derek-payroll",
    }),
    description:
      "Every Monday we compare Crewday against our payroll file and manually correct shift changes that were approved after the weekly cutoff.",
    problemStatement:
      "Approved schedule changes after payroll cutoff are omitted from export files.",
    requestId: payrollCanonicalId,
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [
      { orgKey: "harbor-bites", personaKey: "derek-payroll" },
      { orgKey: "harbor-bites", personaKey: "jen-park" },
      { orgKey: "harbor-bites", personaKey: "lucia-hr" },
    ],
    themeKey: "time_tracking_payroll",
    title: "Approved overtime changes aren't reaching payroll",
  });

  const r8502 = publishedRow({
    canonicalRequestId: payrollCanonicalId,
    daysAgo: 55,
    demoCtx: demoContext({
      orgKey: "norte-retail",
      personaKey: "derek-payroll",
    }),
    description:
      "Store 8 payroll export missing Friday closers who swapped after Thursday 5pm cutoff — same pattern Harbor reported.",
    disposition: "merge",
    dispositionRationale:
      "Same root cause as harbor-bites cutoff sync; consolidate on 8501.",
    duplicateCandidates: [
      {
        candidateRequestId: payrollCanonicalId,
        explanation: "Post-cutoff approved changes absent from payroll export",
        score: 0.89,
      },
    ],
    mergeTargetId: payrollCanonicalId,
    problemStatement:
      "Multi-store retail sees missing hours when swaps finalize after export window.",
    requestId: id("8502"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [
      { orgKey: "norte-retail", personaKey: "derek-payroll" },
      { orgKey: "norte-retail", personaKey: "jen-park" },
    ],
    themeKey: "time_tracking_payroll",
    title: "Friday closers missing from weekly payroll file",
  });

  const r8503 = publishedRow({
    daysAgo: 48,
    demoCtx: demoContext({
      orgKey: "prairie-foods",
      personaKey: "derek-payroll",
    }),
    description:
      "Timeclock punches round differently than scheduled hours — 7 min early clock-in becomes OT in ADP.",
    disposition: "needs_discussion",
    dispositionRationale:
      "Rounding policy is customer-configurable; need clearer Crewday vs ADP settings doc.",
    problemStatement:
      "Early clock-ins create unintended overtime in downstream payroll system.",
    requestId: id("8503"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [
      { orgKey: "prairie-foods", personaKey: "derek-payroll" },
    ],
    themeKey: "time_tracking_payroll",
    title: "Clock-in rounding creates surprise OT",
  });

  const r8504 = publishedRow({
    daysAgo: 43,
    demoCtx: demoContext({
      orgKey: "summit-hospitality",
      personaKey: "derek-payroll",
    }),
    description:
      "Banquet gratuity pools use scheduled hours but actual clock-outs ran late — tips split wrong.",
    disposition: "monitor",
    dispositionRationale:
      "Tip pool logic is hospitality add-on; validate with 2 banquet properties first.",
    problemStatement:
      "Tip pool calculations should use actual time punches not scheduled end times.",
    requestId: id("8504"),
    scenarioTag: tag,
    source: "internal",
    supporterEntries: [
      { orgKey: "summit-hospitality", personaKey: "derek-payroll" },
    ],
    themeKey: "time_tracking_payroll",
    title: "Tip pools should use actual clock-out times",
  });

  const r8505 = publishedRow({
    daysAgo: 39,
    demoCtx: demoContext({
      orgKey: "coast-services",
      personaKey: "aisha-cole",
    }),
    description:
      "GPS geofence punches fail in basement job sites — techs use paper then payroll fixes Friday.",
    disposition: "decline",
    dispositionRationale:
      "Offline geofence accuracy project deferred; recommend manual punch with photo attestation.",
    problemStatement:
      "Indoor/low-GPS sites need reliable clock-in without geofence false negatives.",
    requestId: id("8505"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "coast-services", personaKey: "aisha-cole" }],
    themeKey: "time_tracking_payroll",
    title: "Geofence clock-in fails in basements",
  });

  const r8506 = publishedRow({
    daysAgo: 32,
    demoCtx: demoContext({ orgKey: "vida-cafe", personaKey: "jen-park" }),
    description:
      "Break violations flagged after the fact — want warning when someone clocks back in early from meal break.",
    disposition: "monitor",
    dispositionRationale:
      "Real-time break warnings planned with compliance pack; low volume today.",
    problemStatement:
      "Managers need real-time alerts for meal break compliance violations.",
    requestId: id("8506"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "vida-cafe", personaKey: "jen-park" }],
    themeKey: "time_tracking_payroll",
    title: "Warn when break is too short before shift resumes",
  });

  const r8507 = publishedRow({
    daysAgo: 27,
    demoCtx: demoContext({ orgKey: "harbor-bites", personaKey: "sam-support" }),
    description:
      "Ticket — approved OT not in export AGAIN. Customer attached spreadsheet diff for third week.",
    duplicateCandidates: [
      {
        candidateRequestId: payrollCanonicalId,
        explanation: "Recurring missing approved OT in payroll export",
        score: 0.93,
      },
    ],
    intakeLinkedRequestId: payrollCanonicalId,
    problemStatement:
      "Recurring support case: approved overtime missing from scheduled export.",
    requestId: id("8507"),
    scenarioTag: tag,
    source: "support",
    supporterEntries: [{ orgKey: "harbor-bites", personaKey: "sam-support" }],
    themeKey: "time_tracking_payroll",
    title: "Third week of missing OT in payroll export",
  });

  const r8508 = publishedRow({
    daysAgo: 19,
    demoCtx: demoContext({ orgKey: "norte-retail", personaKey: "lucia-hr" }),
    description:
      "Minor: want job code on each punch for union reporting — not the same as cutoff bug but payroll team groups them.",
    disposition: "decline",
    dispositionRationale:
      "Union job codes require HRIS mapping project; not a quick Crewday-only fix.",
    problemStatement:
      "Union stores require job codes on time punches for compliance reporting.",
    requestId: id("8508"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "norte-retail", personaKey: "lucia-hr" }],
    themeKey: "time_tracking_payroll",
    title: "Job codes on every clock punch for union",
  });

  const r8509 = publishedRow({
    daysAgo: 10,
    demoCtx: demoContext({ orgKey: "prairie-foods", personaKey: "jen-park" }),
    description:
      "export to csv is fine but column order changes every release??? breaks our macro",
    disposition: "monitor",
    dispositionRationale:
      "Stable export schema promised in release notes; verify next GA before closing.",
    problemStatement:
      "Payroll CSV column order must remain stable across releases.",
    requestId: id("8509"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [
      { orgKey: "prairie-foods", personaKey: "jen-park" },
      { orgKey: "prairie-foods", personaKey: "derek-payroll" },
    ],
    themeKey: "time_tracking_payroll",
    title: "Stop reordering payroll CSV columns each release",
  });

  r8501.duplicateCandidates = [
    {
      candidateRequestId: id("8502"),
      explanation: "Post-cutoff changes missing from export",
      score: 0.89,
    },
    {
      candidateRequestId: id("8507"),
      explanation: "Same missing OT after approval pattern",
      score: 0.93,
    },
  ];

  return [r8501, r8502, r8503, r8504, r8505, r8506, r8507, r8508, r8509];
};
