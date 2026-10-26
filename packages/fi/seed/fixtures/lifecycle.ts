import type { SeedRequestRow } from "../types";
import {
  archivedRow,
  demoContext,
  draftRow,
  id,
  pendingConfirmRow,
  triagingRow,
} from "./helpers";

export const lifecycleRows = (): SeedRequestRow[] => {
  const drafts: SeedRequestRow[] = [
    draftRow({
      daysAgo: 3,
      demoCtx: demoContext({ orgKey: "vida-cafe", personaKey: "morgan-pm" }),
      description:
        "Internal draft — evaluating whether to bundle kiosk mode with offline schedule cache.",
      problemStatement:
        "Product team drafting positioning for offline + kiosk capabilities.",
      requestId: id("8901"),
      scenarioTag: "lifecycle_draft",
      source: "internal",
      themeKey: "mobile_reliability",
      title: "Draft: kiosk + offline bundle positioning",
    }),
    draftRow({
      daysAgo: 2,
      demoCtx: demoContext({ orgKey: "harbor-bites", personaKey: "jen-park" }),
      description:
        "manager typing... need way to see who hasn't acknowledged new schedule before publish",
      problemStatement:
        "Managers want acknowledgment tracking before schedule publish.",
      requestId: id("8902"),
      scenarioTag: "lifecycle_draft",
      source: "customer",
      themeKey: "notifications",
      title: "who acked the schedule (unfinished thought)",
    }),
    draftRow({
      daysAgo: 1,
      demoCtx: demoContext({
        orgKey: "norte-retail",
        personaKey: "priya-sales",
      }),
      description:
        "RFP bullet: multi-tenant analytics — WIP notes from sales call, not ready to submit.",
      problemStatement:
        "Sales capturing prospect RFP requirements before formal submission.",
      requestId: id("8903"),
      scenarioTag: "lifecycle_draft",
      source: "prospect",
      themeKey: "reporting_operations",
      title: "RFP notes — regional analytics (draft)",
    }),
    draftRow({
      daysAgo: 1,
      demoCtx: demoContext({
        orgKey: "coast-services",
        personaKey: "marco-ruiz",
      }),
      description:
        "something about van dispatch + crewday schedule mismatch — will finish later",
      problemStatement:
        "Incomplete employee feedback about dispatch vs schedule sync.",
      requestId: id("8904"),
      scenarioTag: "lifecycle_draft",
      source: "customer",
      themeKey: "scheduling_coverage",
      title: "dispatch van list wrong??",
    }),
  ];

  const triaging = triagingRow({
    daysAgo: 4,
    demoCtx: demoContext({
      orgKey: "prairie-foods",
      personaKey: "sam-support",
    }),
    description:
      "Support forwarding: bakery manager says overnight shift template copies wrong day-of-week pattern.",
    problemStatement:
      "Overnight shift templates may copy incorrect DOW pattern when duplicated.",
    requestId: id("8905"),
    scenarioTag: "lifecycle_triaging",
    source: "support",
    themeKey: "scheduling_coverage",
    title: "Overnight template copies wrong days",
  });

  const archived = archivedRow({
    daysAgo: 80,
    demoCtx: demoContext({ orgKey: "vida-cafe", personaKey: "morgan-pm" }),
    description:
      "2024 idea: integrate with legacy POS timeclock — customer churned, archiving intake.",
    problemStatement:
      "Legacy POS integration request archived after customer churn.",
    requestId: id("8906"),
    scenarioTag: "lifecycle_archived",
    source: "internal",
    themeKey: "platform_other",
    title: "Legacy POS timeclock integration (churned account)",
  });

  const pendingConfirm = pendingConfirmRow({
    daysAgo: 5,
    decisionBrief:
      "Push notification for open shifts overlaps notifications theme; confirm submitter wants employee-facing alerts not manager digest.",
    demoCtx: demoContext({ orgKey: "vida-cafe", personaKey: "morgan-pm" }),
    description:
      "Proposal: push when new open shift matches employee availability — pending PM confirm before publish.",
    duplicateCandidates: [
      {
        candidateRequestId: id("8401"),
        explanation: "Both concern employee push notification behavior",
        score: 0.58,
      },
    ],
    problemStatement:
      "Product proposal for proactive open-shift push matched to availability.",
    requestId: id("8907"),
    scenarioTag: "lifecycle_pending_confirm",
    source: "internal",
    themeKey: "notifications",
    title: "Push when open shift matches my availability",
  });

  return [...drafts, triaging, archived, pendingConfirm];
};
