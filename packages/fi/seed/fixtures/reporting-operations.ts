import type { SeedRequestRow } from "../types";
import { demoContext, id, publishedRow } from "./helpers";

const tag = "regional_visibility";

export const reportingOperationsRows = (): SeedRequestRow[] => {
  const r8801 = publishedRow({
    daysAgo: 51,
    demoCtx: demoContext({ orgKey: "norte-retail", personaKey: "aisha-cole" }),
    description:
      "We operate 28 stores. Our regional leads need to spot coverage gaps across stores without gaining access to every employee's compensation information.",
    problemStatement:
      "Regional managers need multi-store coverage gap visibility without wage or PII exposure.",
    requestId: id("8801"),
    scenarioTag: tag,
    source: "prospect",
    supporterEntries: [
      { orgKey: "norte-retail", personaKey: "aisha-cole" },
      { orgKey: "norte-retail", personaKey: "priya-sales" },
      { orgKey: "norte-retail", personaKey: "tom-franchise" },
    ],
    themeKey: "reporting_operations",
    title: "Regional coverage gaps without seeing everyone's pay",
  });

  const r8802 = publishedRow({
    daysAgo: 45,
    demoCtx: demoContext({ orgKey: "harbor-bites", personaKey: "aisha-cole" }),
    description:
      "Dashboard: labor % vs forecast by location for last week — export to Excel for ops review.",
    disposition: "monitor",
    dispositionRationale:
      "Labor % dashboard in beta; harbor-bites on waitlist for GA.",
    problemStatement:
      "Ops leaders need weekly labor percentage vs forecast export by location.",
    requestId: id("8802"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "harbor-bites", personaKey: "aisha-cole" }],
    themeKey: "reporting_operations",
    title: "Export labor % vs forecast by store",
  });

  const r8803 = publishedRow({
    daysAgo: 40,
    demoCtx: demoContext({ orgKey: "prairie-foods", personaKey: "aisha-cole" }),
    description:
      "Compare scheduled vs actual hours across deli and checkout — one report, not three clicks per department.",
    disposition: "monitor",
    dispositionRationale:
      "Cross-department labor report bundled with 8802 dashboard GA.",
    problemStatement:
      "Grocery operators need cross-department scheduled vs actual hours in one report.",
    requestId: id("8803"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [
      { orgKey: "prairie-foods", personaKey: "aisha-cole" },
      { orgKey: "prairie-foods", personaKey: "jen-park" },
    ],
    themeKey: "reporting_operations",
    title: "One report for scheduled vs actual by department",
  });

  const r8804 = publishedRow({
    daysAgo: 36,
    demoCtx: demoContext({
      orgKey: "summit-hospitality",
      personaKey: "aisha-cole",
    }),
    description:
      "Event staffing report — how many banquet servers short per property this weekend.",
    disposition: "needs_discussion",
    dispositionRationale:
      "Event staffing metrics overlap coverage engine; define canonical metric first.",
    problemStatement:
      "Hospitality ops needs weekend event staffing shortage rollup by property.",
    requestId: id("8804"),
    scenarioTag: tag,
    source: "internal",
    supporterEntries: [
      { orgKey: "summit-hospitality", personaKey: "aisha-cole" },
    ],
    themeKey: "reporting_operations",
    title: "Weekend banquet staffing shortage rollup",
  });

  const r8805 = publishedRow({
    daysAgo: 30,
    demoCtx: demoContext({
      orgKey: "coast-services",
      personaKey: "aisha-cole",
    }),
    description:
      "Dispatch board: which crews are over/under hours contract this month.",
    disposition: "monitor",
    dispositionRationale:
      "Contract utilization is field-services vertical bet; coast-services design partner.",
    problemStatement:
      "Field services needs contract hours utilization view across active crews.",
    requestId: id("8805"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "coast-services", personaKey: "aisha-cole" }],
    themeKey: "reporting_operations",
    title: "Crew hours vs monthly contract utilization",
  });

  const r8806 = publishedRow({
    daysAgo: 24,
    demoCtx: demoContext({ orgKey: "vida-cafe", personaKey: "jen-park" }),
    description:
      "DM wants photo of daily labor ticket attached to close report — probably out of scope but keeps asking",
    disposition: "decline",
    dispositionRationale:
      "Document attachments belong to store ops tools, not scheduling analytics.",
    problemStatement:
      "District managers want arbitrary file attachments on daily labor reports.",
    requestId: id("8806"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "vida-cafe", personaKey: "jen-park" }],
    themeKey: "reporting_operations",
    title: "Attach photos to daily labor close report",
  });

  const r8807 = publishedRow({
    daysAgo: 18,
    demoCtx: demoContext({
      orgKey: "norte-retail",
      personaKey: "derek-payroll",
    }),
    description:
      "Corporate asks for open shift fill rate by district — we calculate in Excel from exports today.",
    disposition: "monitor",
    dispositionRationale:
      "Fill-rate metric depends on regional dashboard (8801); ship together.",
    duplicateCandidates: [
      {
        candidateRequestId: id("8801"),
        explanation: "Both support regional ops visibility across stores",
        score: 0.64,
      },
    ],
    problemStatement:
      "District leaders need open-shift fill rate analytics without manual Excel.",
    requestId: id("8807"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "norte-retail", personaKey: "derek-payroll" }],
    themeKey: "reporting_operations",
    title: "Open shift fill rate by district",
  });

  const r8808 = publishedRow({
    daysAgo: 12,
    demoCtx: demoContext({ orgKey: "harbor-bites", personaKey: "priya-sales" }),
    description:
      "Prospect wants API for coverage gaps — related to dashboard but integration not reporting UI.",
    disposition: "monitor",
    dispositionRationale:
      "Public API for coverage metrics under enterprise tier discussion.",
    problemStatement:
      "Enterprise prospects want API access to coverage gap metrics across sites.",
    requestId: id("8808"),
    scenarioTag: tag,
    source: "prospect",
    supporterEntries: [{ orgKey: "harbor-bites", personaKey: "priya-sales" }],
    themeKey: "reporting_operations",
    title: "API for multi-site coverage gap metrics",
  });

  const r8809 = publishedRow({
    daysAgo: 6,
    demoCtx: demoContext({
      orgKey: "summit-hospitality",
      personaKey: "jen-park",
    }),
    description:
      "snow day template — mark all locations delayed open and see staffing impact in one view",
    disposition: "needs_discussion",
    dispositionRationale:
      "Incident mode overlaps corporate comms tools; define MVP with summit ops.",
    problemStatement:
      "Ops needs weather incident mode showing staffing impact across properties.",
    requestId: id("8809"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [
      { orgKey: "summit-hospitality", personaKey: "jen-park" },
      { orgKey: "summit-hospitality", personaKey: "sam-support" },
    ],
    themeKey: "reporting_operations",
    title: "Weather delay impact across all properties",
  });

  r8801.duplicateCandidates = [
    {
      candidateRequestId: id("8807"),
      explanation: "Regional analytics for district-level staffing visibility",
      score: 0.64,
    },
  ];

  return [r8801, r8802, r8803, r8804, r8805, r8806, r8807, r8808, r8809];
};
