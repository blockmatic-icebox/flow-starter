import type { SeedRequestRow } from "../types";
import { demoContext, id, publishedRow } from "./helpers";

const tag = "availability_time_off";

export const availabilityTimeOffRows = (): SeedRequestRow[] => {
  const r8301 = publishedRow({
    daysAgo: 58,
    demoCtx: demoContext({ orgKey: "vida-cafe", personaKey: "yuki-student" }),
    description:
      "I put unavailable every Tue/Thu for class but managers keep scheduling me anyway. Says availability is 'suggestion only' in training??",
    problemStatement:
      "Recurring student availability should hard-block scheduling unless a manager explicitly overrides.",
    requestId: id("8301"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [
      { orgKey: "vida-cafe", personaKey: "yuki-student" },
      { orgKey: "vida-cafe", personaKey: "marco-ruiz" },
    ],
    themeKey: "availability_time_off",
    title: "Classes on Tue/Thu but I still get scheduled",
  });

  const r8302 = publishedRow({
    daysAgo: 51,
    demoCtx: demoContext({ orgKey: "harbor-bites", personaKey: "jen-park" }),
    description:
      "PTO requests pile up in email. Need single queue with blackout dates for holiday weekend.",
    disposition: "monitor",
    dispositionRationale:
      "Unified PTO inbox ships in H2; monitor adoption of calendar export workaround.",
    problemStatement:
      "Managers need centralized time-off requests with corporate blackout enforcement.",
    requestId: id("8302"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "harbor-bites", personaKey: "jen-park" }],
    themeKey: "availability_time_off",
    title: "PTO inbox with holiday blackout dates",
  });

  const r8303 = publishedRow({
    daysAgo: 47,
    demoCtx: demoContext({ orgKey: "norte-retail", personaKey: "lucia-hr" }),
    description:
      "Leave balances from HRIS don't match Crewday — employees argue about remaining PTO at the counter.",
    disposition: "needs_discussion",
    dispositionRationale:
      "HRIS sync vs read-only display — integration team sizing Q3.",
    problemStatement:
      "Displayed PTO balance should sync with HRIS or show 'estimated' disclaimer.",
    requestId: id("8303"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [
      { orgKey: "norte-retail", personaKey: "lucia-hr" },
      { orgKey: "norte-retail", personaKey: "derek-payroll" },
    ],
    themeKey: "availability_time_off",
    title: "PTO balance disagrees with HRIS",
  });

  const r8304 = publishedRow({
    daysAgo: 42,
    demoCtx: demoContext({ orgKey: "prairie-foods", personaKey: "jen-park" }),
    description:
      "Supervisor approved my vacation in Crewday but it never hit the printed wall schedule in back office.",
    disposition: "monitor",
    dispositionRationale:
      "Print workflow is customer process; ensure digital schedule reflects PTO first.",
    duplicateCandidates: [
      {
        candidateRequestId: id("8302"),
        explanation:
          "Both about time-off approval not propagating to schedules",
        score: 0.62,
      },
    ],
    problemStatement:
      "Approved time off must remove shifts from published schedules automatically.",
    requestId: id("8304"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "prairie-foods", personaKey: "jen-park" }],
    themeKey: "availability_time_off",
    title: "Approved vacation still on wall schedule",
  });

  const r8305 = publishedRow({
    daysAgo: 37,
    demoCtx: demoContext({
      orgKey: "summit-hospitality",
      personaKey: "lucia-hr",
    }),
    description:
      "Religious accommodation requests need private notes HR only — managers shouldn't see medical detail.",
    disposition: "needs_discussion",
    dispositionRationale:
      "Privacy model requires role-scoped fields; legal reviewing minimum viable approach.",
    problemStatement:
      "Sensitive time-off reasons need HR-only visibility on requests.",
    requestId: id("8305"),
    scenarioTag: tag,
    source: "internal",
    supporterEntries: [
      { orgKey: "summit-hospitality", personaKey: "lucia-hr" },
    ],
    themeKey: "availability_time_off",
    title: "HR-only notes on accommodation requests",
  });

  const r8306 = publishedRow({
    daysAgo: 31,
    demoCtx: demoContext({
      orgKey: "coast-services",
      personaKey: "marco-ruiz",
    }),
    description:
      "Solicité viernes libre hace dos semanas y nadie respondió. / I asked for Friday off two weeks ago and nobody answered.",
    disposition: "monitor",
    dispositionRationale:
      "Pending-request SLA ties to manager notification work; revisit after 8405 ships.",
    problemStatement:
      "Bilingual crews need clear SLA and status on pending time-off requests.",
    requestId: id("8306"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "coast-services", personaKey: "marco-ruiz" }],
    themeKey: "availability_time_off",
    title: "Sin respuesta a mi solicitud de día libre",
  });

  const r8307 = publishedRow({
    daysAgo: 26,
    demoCtx: demoContext({ orgKey: "vida-cafe", personaKey: "jen-park" }),
    description:
      "Availability templates per semester — bulk apply for student hires in August.",
    disposition: "decline",
    dispositionRationale:
      "Bulk template import available via CSV today; not building semester wizard this year.",
    problemStatement:
      "Seasonal student staff need bulk recurring availability templates.",
    requestId: id("8307"),
    scenarioTag: tag,
    source: "prospect",
    supporterEntries: [{ orgKey: "vida-cafe", personaKey: "jen-park" }],
    themeKey: "availability_time_off",
    title: "Bulk set student availability each semester",
  });

  const r8308 = publishedRow({
    daysAgo: 20,
    demoCtx: demoContext({
      orgKey: "norte-retail",
      personaKey: "tom-franchise",
    }),
    description:
      "Corporate mandates 2 weeks notice for PTO but Crewday lets employees request tomorrow off without warning.",
    disposition: "decline",
    dispositionRationale:
      "Notice rules vary by franchise agreement; configure per org not global default.",
    problemStatement:
      "Franchisees want configurable minimum notice before PTO submission.",
    requestId: id("8308"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "norte-retail", personaKey: "tom-franchise" }],
    themeKey: "availability_time_off",
    title: "Enforce two-week PTO notice per franchise",
  });

  const r8309 = publishedRow({
    daysAgo: 14,
    demoCtx: demoContext({
      orgKey: "harbor-bites",
      personaKey: "derek-payroll",
    }),
    description:
      "Unpaid leave days still show as scheduled hours in labor forecast — skews OT projections.",
    disposition: "needs_discussion",
    dispositionRationale:
      "Forecasting uses scheduled hours by design; unpaid leave rules vary by state.",
    problemStatement:
      "Approved unpaid leave should remove hours from labor forecasts immediately.",
    requestId: id("8309"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [
      { orgKey: "harbor-bites", personaKey: "derek-payroll" },
      { orgKey: "harbor-bites", personaKey: "jen-park" },
    ],
    themeKey: "availability_time_off",
    title: "Unpaid leave still counts in labor forecast",
  });

  return [r8301, r8302, r8303, r8304, r8305, r8306, r8307, r8308, r8309];
};
