import type { SeedRequestRow } from "../types";
import { demoContext, id, publishedRow } from "./helpers";

const tag = "mobile_offline";

export const mobileReliabilityRows = (): SeedRequestRow[] => {
  const r8701 = publishedRow({
    daysAgo: 53,
    demoCtx: demoContext({
      orgKey: "coast-services",
      personaKey: "marco-ruiz",
    }),
    description:
      "No signal in parking garage — app shows blank schedule until I drive to Starbucks wifi. Need last downloaded week offline.",
    problemStatement:
      "Field employees need offline access to their published schedule without connectivity.",
    requestId: id("8701"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [
      { orgKey: "coast-services", personaKey: "marco-ruiz" },
      { orgKey: "coast-services", personaKey: "aisha-cole" },
    ],
    themeKey: "mobile_reliability",
    title: "See my schedule offline in dead zones",
  });

  const r8702 = publishedRow({
    daysAgo: 47,
    demoCtx: demoContext({ orgKey: "vida-cafe", personaKey: "yuki-student" }),
    description: "old iphone 8 crewday crashes when opening week view 💀",
    disposition: "monitor",
    dispositionRationale:
      "Legacy device support tracked in mobile crash dashboard; fix targeted 3.8.2.",
    problemStatement:
      "Older iOS devices crash when loading dense week schedule views.",
    requestId: id("8702"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "vida-cafe", personaKey: "yuki-student" }],
    themeKey: "mobile_reliability",
    title: "App crashes on iPhone 8 week view",
  });

  const r8703 = publishedRow({
    daysAgo: 42,
    demoCtx: demoContext({ orgKey: "norte-retail", personaKey: "jen-park" }),
    description:
      "Store Wi-Fi captive portal blocks Crewday sync — staff think schedule vanished.",
    disposition: "monitor",
    dispositionRationale:
      "Cached schedule banner ships with offline mode (8701); retail pilot stores first.",
    problemStatement:
      "App should show cached schedule with banner when captive portal blocks sync.",
    requestId: id("8703"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "norte-retail", personaKey: "jen-park" }],
    themeKey: "mobile_reliability",
    title: "Show cached schedule when store Wi-Fi blocks sync",
  });

  const r8704 = publishedRow({
    daysAgo: 38,
    demoCtx: demoContext({ orgKey: "harbor-bites", personaKey: "marco-ruiz" }),
    description:
      "Dark mode schedule text unreadable in kitchen fluorescent lighting — contrast issue not offline but mobile UX.",
    disposition: "decline",
    dispositionRationale:
      "Contrast tweak shipped in 3.7.1; closing as resolved unless reopened with screenshots.",
    problemStatement:
      "Mobile schedule contrast fails readability in bright kitchen environments.",
    requestId: id("8704"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "harbor-bites", personaKey: "marco-ruiz" }],
    themeKey: "mobile_reliability",
    title: "Unreadable schedule text in bright kitchens",
  });

  const r8705 = publishedRow({
    daysAgo: 33,
    demoCtx: demoContext({ orgKey: "prairie-foods", personaKey: "jen-park" }),
    description:
      "Rural stores lose LTE — managers print schedules because app won't load. Offline publish cache please.",
    disposition: "merge",
    dispositionRationale:
      "Same offline schedule need as 8701; track on canonical offline epic.",
    duplicateCandidates: [
      {
        candidateRequestId: id("8701"),
        explanation: "Both require offline schedule access without network",
        score: 0.86,
      },
    ],
    mergeTargetId: id("8701"),
    problemStatement:
      "Rural grocery stores need reliable offline schedule viewing for staff.",
    requestId: id("8705"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [
      { orgKey: "prairie-foods", personaKey: "jen-park" },
      { orgKey: "prairie-foods", personaKey: "aisha-cole" },
    ],
    themeKey: "mobile_reliability",
    title: "Offline schedule for rural stores with bad LTE",
  });

  const r8706 = publishedRow({
    daysAgo: 25,
    demoCtx: demoContext({
      orgKey: "summit-hospitality",
      personaKey: "jen-park",
    }),
    description:
      "Tablet kiosk mode for housekeeping — schedule check at linen room without personal phone login.",
    disposition: "needs_discussion",
    dispositionRationale:
      "Shared kiosk auth has security implications; hospitality PM defining MVP.",
    problemStatement:
      "Properties want shared-device kiosk for staff schedule lookup without personal accounts.",
    requestId: id("8706"),
    scenarioTag: tag,
    source: "prospect",
    supporterEntries: [
      { orgKey: "summit-hospitality", personaKey: "jen-park" },
    ],
    themeKey: "mobile_reliability",
    title: "Kiosk mode for housekeeping schedule lookup",
  });

  const r8707 = publishedRow({
    daysAgo: 20,
    demoCtx: demoContext({ orgKey: "vida-cafe", personaKey: "sam-support" }),
    description:
      "Android 14 — app background refresh disabled by default; staff miss updates (see also notifications).",
    disposition: "monitor",
    dispositionRationale:
      "Joint track with notifications theme; in-app education experiment running.",
    problemStatement:
      "Android background restrictions cause stale schedules unless users change OS settings.",
    requestId: id("8707"),
    scenarioTag: tag,
    source: "support",
    supporterEntries: [{ orgKey: "vida-cafe", personaKey: "sam-support" }],
    themeKey: "mobile_reliability",
    title: "Android 14 background refresh kills schedule sync",
  });

  const r8708 = publishedRow({
    daysAgo: 13,
    demoCtx: demoContext({
      orgKey: "coast-services",
      personaKey: "sam-support",
    }),
    description:
      "Clock-in button spins forever on 3G — need retry not infinite loader",
    disposition: "monitor",
    dispositionRationale:
      "Mobile networking UX fix queued; low volume but high frustration.",
    problemStatement:
      "Time clock actions need timeout and retry UX on slow mobile networks.",
    requestId: id("8708"),
    scenarioTag: tag,
    source: "support",
    supporterEntries: [{ orgKey: "coast-services", personaKey: "sam-support" }],
    themeKey: "mobile_reliability",
    title: "Clock-in spinner hangs on slow 3G",
  });

  const r8709 = publishedRow({
    daysAgo: 7,
    demoCtx: demoContext({ orgKey: "norte-retail", personaKey: "marco-ruiz" }),
    description:
      "La app se cierra sola cuando cambio de turno en el metro / app closes when I swap shifts on subway",
    disposition: "needs_discussion",
    dispositionRationale:
      "Crash may be swap-specific or general offline; mobile eng reproducing.",
    problemStatement:
      "Shift swap flow should survive brief connectivity loss during commute.",
    requestId: id("8709"),
    scenarioTag: tag,
    source: "customer",
    supporterEntries: [{ orgKey: "norte-retail", personaKey: "marco-ruiz" }],
    themeKey: "mobile_reliability",
    title: "App crashes mid swap on spotty subway Wi-Fi",
  });

  r8701.duplicateCandidates = [
    {
      candidateRequestId: id("8705"),
      explanation: "Offline schedule access for low-connectivity sites",
      score: 0.86,
    },
  ];

  return [r8701, r8702, r8703, r8704, r8705, r8706, r8707, r8708, r8709];
};
