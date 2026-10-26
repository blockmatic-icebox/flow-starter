import type { SeedRequestRow } from "../types";
import { demoContext, id, publishedRow } from "./helpers";

const tag = "sick_call_coverage";

export const schedulingCoverageRows = (): SeedRequestRow[] => {
  const r8101 = publishedRow({
    daysAgo: 52,
    demoCtx: demoContext({ orgKey: "harbor-bites", personaKey: "jen-park" }),
    description:
      "Saturday dinner rush and I'm down a cook. I need Crewday to show me who is certified on the fryer AND hasn't hit weekly hours yet. Right now I scroll three screens and text people who already said no.",
    disposition: "needs_discussion",
    dispositionRationale:
      "Coverage suggestions exist in roadmap Q2; need product call on eligibility rules vs manager override.",
    problemStatement:
      "Managers need ranked replacement candidates filtered by role certification and hours when someone calls out sick.",
    requestId: id("8101"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [
      { orgKey: "harbor-bites", personaKey: "jen-park" },
      { orgKey: "harbor-bites", personaKey: "tom-franchise" },
    ],
    themeKey: "scheduling_coverage",
    title: "Who can cover a sick call on short notice?",
  });

  const r8102 = publishedRow({
    daysAgo: 48,
    decisionBrief:
      "Align with shift-offer fairness work; may share backend with open-shift marketplace.",
    demoCtx: demoContext({ orgKey: "vida-cafe", personaKey: "marco-ruiz" }),
    description:
      "when someone calls out the manager blasts the group chat. same 2 people always pick up extra shifts. feels rigged lol",
    problemStatement:
      "Open shifts are not offered equitably; the same employees absorb extra work.",
    requestId: id("8102"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [
      { orgKey: "vida-cafe", personaKey: "marco-ruiz" },
      { orgKey: "vida-cafe", personaKey: "yuki-student" },
      { orgKey: "vida-cafe", personaKey: "jen-park" },
    ],
    themeKey: "scheduling_coverage",
    title: "Stop giving all open shifts to the same baristas",
  });

  const r8103 = publishedRow({
    daysAgo: 44,
    demoCtx: demoContext({ orgKey: "norte-retail", personaKey: "jen-park" }),
    description:
      "Ticket #88421 — Store 14 opener no-show. Manager wants push list of nearby staff who worked that shift in last 30 days.",
    disposition: "merge",
    dispositionRationale:
      "Support intake duplicate of sick-call coverage canonical 8101.",
    intakeLinkedRequestId: id("8101"),
    mergeTargetId: id("8101"),
    problemStatement:
      "Support needs a repeatable workflow when stores request emergency coverage lists.",
    requestId: id("8103"),
    scenarioTag: tag,
    source: "support",
    supporterEntries: [{ orgKey: "norte-retail", personaKey: "sam-support" }],
    themeKey: "scheduling_coverage",
    title: "Emergency coverage list for no-show opener",
  });

  const r8104 = publishedRow({
    daysAgo: 38,
    demoCtx: demoContext({
      orgKey: "summit-hospitality",
      personaKey: "aisha-cole",
    }),
    description:
      "Housekeeping and F&B share a float pool on paper but Crewday treats them as separate rosters. When banquets spike we can't pull trained floaters across departments.",
    disposition: "monitor",
    dispositionRationale:
      "Valid for summit-sized ops; wait until cross-department eligibility ships in pilot.",
    problemStatement:
      "Multi-department properties need shared float pools for coverage without duplicating employee records.",
    requestId: id("8104"),
    scenarioTag: tag,
    source: "prospect",
    supporterEntries: [
      { orgKey: "summit-hospitality", personaKey: "aisha-cole" },
    ],
    themeKey: "scheduling_coverage",
    title: "Cross-department float pool for events",
  });

  const r8105 = publishedRow({
    daysAgo: 33,
    demoCtx: demoContext({
      orgKey: "coast-services",
      personaKey: "aisha-cole",
    }),
    description:
      "Crew leads need to see which job sites are understaffed tomorrow before dispatching vans. Crewday mobile only shows my site.",
    problemStatement:
      "Field services managers need multi-site understaffing visibility for next-day dispatch.",
    requestId: id("8105"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [
      { orgKey: "coast-services", personaKey: "aisha-cole" },
      { orgKey: "coast-services", personaKey: "marco-ruiz" },
    ],
    themeKey: "scheduling_coverage",
    title: "Tomorrow's understaffed sites on one screen",
  });

  const r8106 = publishedRow({
    daysAgo: 28,
    demoCtx: demoContext({ orgKey: "prairie-foods", personaKey: "jen-park" }),
    description:
      "Bakery call-in at 4am — need subs who already completed food safety cert. Export from training module doesn't tie to scheduling.",
    disposition: "decline",
    dispositionRationale:
      "Training LMS integration is 2027 bet; managers can use manual cert flags until then.",
    problemStatement:
      "Grocery managers want certification-aware replacement suggestions tied to LMS completion.",
    requestId: id("8106"),
    scenarioTag: tag,
    source: "internal",
    supporterEntries: [{ orgKey: "prairie-foods", personaKey: "jen-park" }],
    themeKey: "scheduling_coverage",
    title: "Pull replacements from food safety training status",
  });

  const r8107 = publishedRow({
    daysAgo: 22,
    demoCtx: demoContext({ orgKey: "harbor-bites", personaKey: "sam-support" }),
    description:
      "Customer says coverage bot texts staff who are marked unavailable. They want unavailable respected unless manager overrides.",
    disposition: "monitor",
    dispositionRationale:
      "Track volume after unavailable-filter beta; merge into 8101 if same eligibility engine.",
    duplicateCandidates: [
      {
        candidateRequestId: id("8101"),
        explanation: "Both describe sick-call replacement candidate filtering",
        score: 0.71,
      },
    ],
    problemStatement:
      "Automated coverage outreach should exclude unavailable employees by default.",
    requestId: id("8107"),
    scenarioTag: tag,
    source: "support",
    supporterEntries: [{ orgKey: "harbor-bites", personaKey: "sam-support" }],
    themeKey: "scheduling_coverage",
    title: "Coverage texts ignore unavailable blocks",
  });

  const r8108 = publishedRow({
    daysAgo: 18,
    demoCtx: demoContext({ orgKey: "vida-cafe", personaKey: "jen-park" }),
    description:
      "Need SLA timer when coverage request unanswered — escalate to regional after 15 min on weekends.",
    disposition: "needs_discussion",
    dispositionRationale:
      "Escalation thresholds differ weekend vs weekday; ops council deciding defaults.",
    problemStatement:
      "High-volume cafes need timed escalation when nobody accepts an open shift.",
    requestId: id("8108"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "vida-cafe", personaKey: "jen-park" }],
    themeKey: "scheduling_coverage",
    title: "Escalate uncovered shifts after 15 minutes",
  });

  const r8109 = publishedRow({
    daysAgo: 12,
    demoCtx: demoContext({
      orgKey: "norte-retail",
      personaKey: "tom-franchise",
    }),
    description:
      "Can we auto-offer overtime to part-timers under 32h before calling in full-timers? union store 7 is asking.",
    disposition: "needs_discussion",
    dispositionRationale:
      "Union rule variance by store; legal review before automating OT offers.",
    problemStatement:
      "Franchisees want overtime offered to part-time staff before full-time mandatory OT.",
    requestId: id("8109"),
    scenarioTag: tag,
    source: "prospect",
    supporterEntries: [
      { orgKey: "norte-retail", personaKey: "tom-franchise" },
      { orgKey: "norte-retail", personaKey: "lucia-hr" },
    ],
    themeKey: "scheduling_coverage",
    title: "Offer OT to part-timers before mandatory full-timers",
  });

  const r8110 = publishedRow({
    daysAgo: 8,
    demoCtx: demoContext({
      orgKey: "summit-hospitality",
      personaKey: "jen-park",
    }),
    description:
      "banquet server called sick 2h before — manager reverted to phone tree. crewday showed zero eligible even though 4 people were free",
    disposition: "monitor",
    dispositionRationale:
      "False-negative eligibility bug filed eng-4412; monitor fix in 3.9 patch.",
    problemStatement:
      "Eligibility engine false negatives block managers from seeing truly available staff during events.",
    requestId: id("8110"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [
      { orgKey: "summit-hospitality", personaKey: "jen-park" },
      { orgKey: "summit-hospitality", personaKey: "sam-support" },
    ],
    themeKey: "scheduling_coverage",
    title: "Coverage list empty but staff are actually free",
  });

  return [r8101, r8102, r8103, r8104, r8105, r8106, r8107, r8108, r8109, r8110];
};
