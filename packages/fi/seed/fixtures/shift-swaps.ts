import type { SeedRequestRow } from "../types";
import { demoContext, id, publishedRow } from "./helpers";

const tag = "shift_swaps";

const swapCanonicalId = id("8201");

export const shiftSwapsRows = (): SeedRequestRow[] => {
  const r8201 = publishedRow({
    daysAgo: 55,
    decisionBrief:
      "Canonical swap reliability story — pair with manager-approval track (8203).",
    demoCtx: demoContext({ orgKey: "harbor-bites", personaKey: "marco-ruiz" }),
    description:
      "Marco agreed to cover Saturday and our manager approved it yesterday, but both of us still see the old schedule. I don't know who's actually supposed to come in.",
    problemStatement:
      "Approved peer shift swaps must update both employees' schedules immediately and stay in sync.",
    requestId: swapCanonicalId,
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [
      { orgKey: "harbor-bites", personaKey: "marco-ruiz" },
      { orgKey: "harbor-bites", personaKey: "jen-park" },
      { orgKey: "harbor-bites", personaKey: "derek-payroll" },
    ],
    themeKey: "shift_swaps",
    title: "My approved shift swap disappeared",
  });

  const r8202 = publishedRow({
    canonicalRequestId: swapCanonicalId,
    daysAgo: 54,
    demoCtx: demoContext({ orgKey: "harbor-bites", personaKey: "sam-support" }),
    description:
      "Case 44102 — Guest reports swap showed approved in app but timeclock still had original shift. Same as Marco ticket last week.",
    disposition: "merge",
    dispositionRationale:
      "Duplicate of FR swap sync defect; track resolution on canonical 8201.",
    duplicateCandidates: [
      {
        candidateRequestId: swapCanonicalId,
        explanation:
          "Same post-approval schedule mismatch after manager sign-off",
        score: 0.91,
      },
    ],
    mergeTargetId: swapCanonicalId,
    problemStatement:
      "Support tickets about swaps reverting after approval belong to one sync defect.",
    requestId: id("8202"),
    scenarioTag: tag,
    source: "support",
    supporterEntries: [{ orgKey: "harbor-bites", personaKey: "sam-support" }],
    themeKey: "shift_swaps",
    title: "Swap approved but timeclock unchanged",
  });

  const r8203 = publishedRow({
    daysAgo: 50,
    demoCtx: demoContext({ orgKey: "harbor-bites", personaKey: "jen-park" }),
    description:
      "People keep swapping closing shifts with coworkers who aren't trained to close. I need to approve the replacement before the change becomes final.",
    problemStatement:
      "Managers require pre-approval before untrained staff can take closing shifts via swap.",
    requestId: id("8203"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [
      { orgKey: "harbor-bites", personaKey: "jen-park" },
      { orgKey: "harbor-bites", personaKey: "tom-franchise" },
      { orgKey: "harbor-bites", personaKey: "lucia-hr" },
    ],
    themeKey: "shift_swaps",
    title: "Need approval before staff trade closing shifts",
  });

  const r8204 = publishedRow({
    daysAgo: 46,
    demoCtx: demoContext({ orgKey: "norte-retail", personaKey: "aisha-cole" }),
    description:
      "Regional leads want read-only visibility into pending swaps across stores without editing schedules.",
    disposition: "monitor",
    dispositionRationale:
      "Visibility layer is lighter lift than approval workflow; ship after manager gates land.",
    problemStatement:
      "Regional managers need a pending-swap dashboard without full schedule edit rights.",
    requestId: id("8204"),
    scenarioTag: tag,
    source: "prospect",
    supporterEntries: [
      { orgKey: "norte-retail", personaKey: "aisha-cole" },
      { orgKey: "norte-retail", personaKey: "priya-sales" },
    ],
    themeKey: "shift_swaps",
    title: "See pending swaps across my region",
  });

  const r8205 = publishedRow({
    daysAgo: 41,
    demoCtx: demoContext({ orgKey: "vida-cafe", personaKey: "yuki-student" }),
    description:
      "traded tuesday opener w/ kai but app still pings me for tuesday??? fix pls",
    duplicateCandidates: [
      {
        candidateRequestId: swapCanonicalId,
        explanation: "Approved swap not reflected in employee view",
        score: 0.84,
      },
    ],
    intakeLinkedRequestId: swapCanonicalId,
    problemStatement:
      "Students experience ghost shifts after swaps — notifications and calendar disagree.",
    requestId: id("8205"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "vida-cafe", personaKey: "yuki-student" }],
    themeKey: "shift_swaps",
    title: "Still getting alerts for a shift I swapped away",
  });

  const r8206 = publishedRow({
    daysAgo: 36,
    demoCtx: demoContext({ orgKey: "prairie-foods", personaKey: "jen-park" }),
    description:
      "Night crew swaps produce hours that break union rest rules. Need hard block, not warning toast.",
    disposition: "needs_discussion",
    dispositionRationale:
      "Policy engine vs manager override — HR wants blocks, ops wants warnings only.",
    problemStatement:
      "Swap workflow must enforce minimum rest periods before acceptance.",
    requestId: id("8206"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [
      { orgKey: "prairie-foods", personaKey: "jen-park" },
      { orgKey: "prairie-foods", personaKey: "lucia-hr" },
    ],
    themeKey: "shift_swaps",
    title: "Block swaps that violate rest between shifts",
  });

  const r8207 = publishedRow({
    daysAgo: 30,
    demoCtx: demoContext({
      orgKey: "coast-services",
      personaKey: "marco-ruiz",
    }),
    description:
      "Swap request sat pending 3 days because manager doesn't open Crewday. Text me when it's approved?",
    disposition: "monitor",
    dispositionRationale:
      "Depends on notification reliability program; link to notifications theme.",
    problemStatement:
      "Employees need proactive confirmation when long-pending swaps are approved or denied.",
    requestId: id("8207"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "coast-services", personaKey: "marco-ruiz" }],
    themeKey: "shift_swaps",
    title: "Tell me when my swap finally gets approved",
  });

  const r8208 = publishedRow({
    daysAgo: 24,
    demoCtx: demoContext({
      orgKey: "summit-hospitality",
      personaKey: "jen-park",
    }),
    description:
      "Allow partial shift swaps (4pm–8pm segment) for banquet servers — full shift swap is too rigid.",
    disposition: "decline",
    dispositionRationale:
      "Partial segments explode payroll reconciliation; revisit with time-tracking rewrite.",
    problemStatement:
      "Hospitality managers want partial-shift swaps for split banquet service.",
    requestId: id("8208"),
    scenarioTag: tag,
    source: "internal",
    supporterEntries: [
      { orgKey: "summit-hospitality", personaKey: "jen-park" },
    ],
    themeKey: "shift_swaps",
    title: "Swap half a shift, not the whole block",
  });

  const r8209 = publishedRow({
    daysAgo: 15,
    demoCtx: demoContext({ orgKey: "harbor-bites", personaKey: "priya-sales" }),
    description:
      "Deal blocker: prospect wants audit log of who approved each swap for SOC review.",
    disposition: "needs_discussion",
    dispositionRationale:
      "Enterprise security wants audit trail; scope with compliance before commit.",
    problemStatement:
      "Enterprise prospects require immutable approval history on shift swaps.",
    requestId: id("8209"),
    scenarioTag: tag,
    source: "prospect",
    supporterEntries: [
      { orgKey: "harbor-bites", personaKey: "priya-sales" },
      { orgKey: "harbor-bites", personaKey: "lucia-hr" },
    ],
    themeKey: "shift_swaps",
    title: "Export swap approval audit trail",
  });

  r8201.duplicateCandidates = [
    {
      candidateRequestId: id("8202"),
      explanation: "Same post-approval schedule mismatch",
      score: 0.91,
    },
    {
      candidateRequestId: id("8205"),
      explanation: "Employee view not updated after approved swap",
      score: 0.84,
    },
  ];

  return [r8201, r8202, r8203, r8204, r8205, r8206, r8207, r8208, r8209];
};
