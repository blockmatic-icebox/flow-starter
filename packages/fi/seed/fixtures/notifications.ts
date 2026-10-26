import type { SeedRequestRow } from "../types";
import { demoContext, id, publishedRow } from "./helpers";

const tag = "missed_notifications";

export const notificationsRows = (): SeedRequestRow[] => {
  const r8401 = publishedRow({
    daysAgo: 57,
    demoCtx: demoContext({ orgKey: "harbor-bites", personaKey: "marco-ruiz" }),
    description:
      "Didn't know my schedule changed until I got to work. This keeps happening.",
    problemStatement:
      "Employees miss schedule changes because push notifications are unreliable or disabled.",
    requestId: id("8401"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [
      { orgKey: "harbor-bites", personaKey: "marco-ruiz" },
      { orgKey: "harbor-bites", personaKey: "jen-park" },
    ],
    themeKey: "notifications",
    title: "Notifications aren't working",
  });

  const r8402 = publishedRow({
    daysAgo: 53,
    demoCtx: demoContext({ orgKey: "vida-cafe", personaKey: "sam-support" }),
    description:
      "Zendesk #9921 — iOS users on 17.4 report silent failures for schedule change pushes after 9pm local.",
    disposition: "merge",
    dispositionRationale:
      "iOS push failure is instance of broader missed notification cluster 8401.",
    intakeLinkedRequestId: id("8401"),
    mergeTargetId: id("8401"),
    problemStatement:
      "iOS push delivery fails for overnight schedule publishes in some time zones.",
    requestId: id("8402"),
    scenarioTag: tag,
    source: "support",
    supporterEntries: [{ orgKey: "vida-cafe", personaKey: "sam-support" }],
    themeKey: "notifications",
    title: "iOS push missed after evening publish",
  });

  const r8403 = publishedRow({
    daysAgo: 49,
    demoCtx: demoContext({
      orgKey: "coast-services",
      personaKey: "marco-ruiz",
    }),
    description:
      "No me llegan los cambios de turno. Mi supervisor cambió mi horario, pero no recibí aviso. Vi el cambio cuando ya era demasiado tarde.",
    duplicateCandidates: [
      {
        candidateRequestId: id("8401"),
        explanation: "Missed awareness of supervisor-initiated schedule change",
        score: 0.79,
      },
    ],
    problemStatement:
      "Spanish-speaking field staff miss shift-change alerts; channel preference may be SMS not push.",
    requestId: id("8403"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "coast-services", personaKey: "marco-ruiz" }],
    themeKey: "notifications",
    title: "No me llegan los cambios de turno",
  });

  const r8404 = publishedRow({
    daysAgo: 45,
    demoCtx: demoContext({ orgKey: "norte-retail", personaKey: "jen-park" }),
    description:
      "Too many pings — swap approved, shift reminder, schedule published all within 5 minutes. Staff mute the app.",
    disposition: "needs_discussion",
    dispositionRationale:
      "Notification batching vs granular controls — product research scheduled with 6 managers.",
    problemStatement:
      "Notification volume causes employees to disable alerts entirely.",
    requestId: id("8404"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "norte-retail", personaKey: "jen-park" }],
    themeKey: "notifications",
    title: "Bundle alerts so people don't mute Crewday",
  });

  const r8405 = publishedRow({
    daysAgo: 40,
    demoCtx: demoContext({
      orgKey: "summit-hospitality",
      personaKey: "jen-park",
    }),
    description:
      "Email fallback when push fails — some staff only check company email on desktop.",
    disposition: "monitor",
    dispositionRationale:
      "Email fallback spec drafted; ship behind feature flag for summit pilot.",
    problemStatement:
      "Schedule changes need automatic email fallback when push delivery fails.",
    requestId: id("8405"),
    scenarioTag: tag,
    source: "prospect",
    supporterEntries: [
      { orgKey: "summit-hospitality", personaKey: "jen-park" },
    ],
    themeKey: "notifications",
    title: "Email me if push doesn't deliver in 10 minutes",
  });

  const r8406 = publishedRow({
    daysAgo: 34,
    demoCtx: demoContext({ orgKey: "prairie-foods", personaKey: "aisha-cole" }),
    description:
      "SMS costs are killing us — need digest option for non-urgent schedule tweaks.",
    disposition: "monitor",
    dispositionRationale:
      "Digest mode depends on notification grouping (8404); pilot with prairie-foods when ready.",
    problemStatement:
      "Regional ops wants lower SMS spend via daily digest for minor schedule edits.",
    requestId: id("8406"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "prairie-foods", personaKey: "aisha-cole" }],
    themeKey: "notifications",
    title: "Daily digest instead of SMS per tiny change",
  });

  const r8407 = publishedRow({
    daysAgo: 29,
    demoCtx: demoContext({
      orgKey: "harbor-bites",
      personaKey: "derek-payroll",
    }),
    description:
      "Separate ask: payroll export failed email goes to personal Gmail not work account — unrelated to shift alerts but same settings screen confusion.",
    disposition: "decline",
    dispositionRationale:
      "Account email correction is admin settings issue, not notification product scope.",
    problemStatement:
      "Payroll export failure notifications route to wrong email address on file.",
    requestId: id("8407"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "harbor-bites", personaKey: "derek-payroll" }],
    themeKey: "notifications",
    title: "Payroll failure emails go to wrong inbox",
  });

  const r8408 = publishedRow({
    daysAgo: 21,
    demoCtx: demoContext({ orgKey: "vida-cafe", personaKey: "yuki-student" }),
    description:
      "android battery saver blocks crewday?? i miss swaps unless i open app",
    duplicateCandidates: [
      {
        candidateRequestId: id("8401"),
        explanation:
          "Employee unaware of schedule/swap updates until opening app",
        score: 0.74,
      },
    ],
    problemStatement:
      "Android battery optimization prevents timely swap and schedule notifications.",
    requestId: id("8408"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "vida-cafe", personaKey: "yuki-student" }],
    themeKey: "notifications",
    title: "Android battery saver hides swap alerts",
  });

  const r8409 = publishedRow({
    daysAgo: 11,
    demoCtx: demoContext({ orgKey: "norte-retail", personaKey: "sam-support" }),
    description:
      "Manager wants loud alert when corporate publishes emergency hours change — distinct sound from marketing promos.",
    disposition: "needs_discussion",
    dispositionRationale:
      "Custom sounds per notification type need mobile platform review.",
    problemStatement:
      "Critical schedule overrides need distinguishable high-priority notification channel.",
    requestId: id("8409"),
    scenarioTag: tag,
    source: "support",
    supporterEntries: [{ orgKey: "norte-retail", personaKey: "sam-support" }],
    themeKey: "notifications",
    title: "Different sound for emergency schedule overrides",
  });

  r8401.duplicateCandidates = [
    {
      candidateRequestId: id("8403"),
      explanation: "User unaware of supervisor schedule change",
      score: 0.79,
    },
    {
      candidateRequestId: id("8408"),
      explanation: "Missed updates until manually opening app",
      score: 0.74,
    },
  ];

  return [r8401, r8402, r8403, r8404, r8405, r8406, r8407, r8408, r8409];
};
