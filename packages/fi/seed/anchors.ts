import { SEED_REFERENCE_ISO } from "./manifest";
import type { SeedRequestRow } from "./types";

const ref = new Date(SEED_REFERENCE_ISO);
const at = (daysAgo: number) =>
  new Date(ref.getTime() - daysAgo * 24 * 60 * 60 * 1000);

const publishedAnchor = ({
  daysAgo,
  disposition,
  dispositionRationale,
  id,
  intakeLinkedRequestId,
  source,
  supportCount,
  themeKey,
  title,
}: {
  daysAgo: number;
  disposition?: SeedRequestRow["disposition"];
  dispositionRationale?: string;
  id: string;
  intakeLinkedRequestId?: string;
  source: SeedRequestRow["source"];
  supportCount: number;
  themeKey: string;
  title: string;
}): SeedRequestRow => {
  const submitted = at(daysAgo);
  const published = at(Math.max(0, daysAgo - 1));
  const triageDone = at(Math.max(0, daysAgo - 1));
  const dispositioned = disposition ? at(Math.max(0, daysAgo - 2)) : null;
  const pmStart =
    disposition && dispositioned
      ? new Date(dispositioned.getTime() - 15 * 60 * 1000)
      : null;

  return {
    decisionBrief: `PM brief for ${title}.`,
    description: `${title} — seeded anchor description.`,
    disposition: disposition ?? null,
    dispositionAt: dispositioned,
    dispositionRationale: dispositionRationale ?? null,
    id,
    intakeLinkedRequestId: intakeLinkedRequestId ?? null,
    pmReviewStartedAt: pmStart,
    problemStatement: `Underlying need: ${title}`,
    publishedAt: published,
    source,
    status: "published",
    submittedAt: submitted,
    supportCount,
    themeKey,
    title,
    triageCompletedAt: triageDone,
  };
};

export const ANCHOR_IDS = {
  fr001: "00000000-0000-4000-8000-000000000001",
  fr002: "00000000-0000-4000-8000-000000000002",
  fr003: "00000000-0000-4000-8000-000000000003",
  fr004: "00000000-0000-4000-8000-000000000004",
  fr005: "00000000-0000-4000-8000-000000000005",
  fr006: "00000000-0000-4000-8000-000000000006",
  fr007: "00000000-0000-4000-8000-000000000007",
  fr008: "00000000-0000-4000-8000-000000000008",
  fr009: "00000000-0000-4000-8000-000000000009",
  fr010: "00000000-0000-4000-8000-000000000010",
  fr011: "00000000-0000-4000-8000-000000000011",
} as const;

export const buildAnchorRows = (): SeedRequestRow[] => {
  const fr001 = publishedAnchor({
    daysAgo: 45,
    id: ANCHOR_IDS.fr001,
    source: "customer",
    supportCount: 14,
    themeKey: "reporting_exports",
    title: "Export dashboards to CSV",
  });
  const fr002 = publishedAnchor({
    daysAgo: 44,
    id: ANCHOR_IDS.fr002,
    intakeLinkedRequestId: ANCHOR_IDS.fr001,
    source: "support",
    supportCount: 6,
    themeKey: "reporting_exports",
    title: "Download CSV of report data",
  });
  const fr003 = publishedAnchor({
    daysAgo: 60,
    disposition: "monitor",
    dispositionRationale:
      "Valuable; wait for CSV export volume from FR-001/002.",
    id: ANCHOR_IDS.fr003,
    source: "prospect",
    supportCount: 3,
    themeKey: "reporting_exports",
    title: "Scheduled weekly email reports",
  });
  const fr004 = publishedAnchor({
    daysAgo: 50,
    id: ANCHOR_IDS.fr004,
    source: "internal",
    supportCount: 2,
    themeKey: "reporting_exports",
    title: "PDF export for board decks",
  });
  const fr005 = publishedAnchor({
    daysAgo: 30,
    id: ANCHOR_IDS.fr005,
    intakeLinkedRequestId: ANCHOR_IDS.fr001,
    source: "customer",
    supportCount: 11,
    themeKey: "collaboration_sharing",
    title: "Share dashboards with external clients",
  });
  const fr006 = publishedAnchor({
    daysAgo: 28,
    id: ANCHOR_IDS.fr006,
    source: "internal",
    supportCount: 8,
    themeKey: "collaboration_sharing",
    title: "Comments on chart widgets",
  });
  const fr007 = publishedAnchor({
    daysAgo: 25,
    id: ANCHOR_IDS.fr007,
    source: "prospect",
    supportCount: 9,
    themeKey: "collaboration_sharing",
    title: "Real-time co-editing on filters",
  });
  const fr008 = publishedAnchor({
    daysAgo: 70,
    disposition: "decline",
    dispositionRationale:
      "Overlaps comment vendor roadmap; use FR-006 thread instead.",
    id: ANCHOR_IDS.fr008,
    source: "support",
    supportCount: 1,
    themeKey: "collaboration_sharing",
    title: "@mentions in dashboard notes",
  });
  const fr009 = publishedAnchor({
    daysAgo: 40,
    id: ANCHOR_IDS.fr009,
    source: "support",
    supportCount: 5,
    themeKey: "integrations_alerts",
    title: "Slack alert when KPI drops",
  });
  const fr010 = publishedAnchor({
    daysAgo: 35,
    id: ANCHOR_IDS.fr010,
    source: "customer",
    supportCount: 4,
    themeKey: "integrations_alerts",
    title: "PagerDuty for critical metrics",
  });

  const fr011Submitted = at(5);
  const fr011: SeedRequestRow = {
    decisionBrief:
      "Mobile push would reuse alert routing; confirm scope with integrations theme.",
    description: "Mobile push for alerts — pending submitter confirm.",
    duplicateCandidates: [
      {
        candidateRequestId: ANCHOR_IDS.fr009,
        explanation: "Similar alert delivery channel",
        score: 0.72,
      },
    ],
    id: ANCHOR_IDS.fr011,
    problemStatement:
      "Teams need proactive mobile notifications when KPIs breach thresholds.",
    source: "internal",
    status: "pending_confirm",
    submittedAt: fr011Submitted,
    supportCount: 0,
    themeKey: "integrations_alerts",
    title: "Mobile push for alerts",
    triageCompletedAt: at(4),
  };

  fr001.duplicateCandidates = [
    {
      candidateRequestId: ANCHOR_IDS.fr002,
      explanation: "Lexical overlap on CSV export",
      score: 0.88,
    },
  ];
  fr002.duplicateCandidates = [
    {
      candidateRequestId: ANCHOR_IDS.fr001,
      explanation: "Lexical overlap on CSV export",
      score: 0.88,
    },
  ];

  return [
    fr001,
    fr002,
    fr003,
    fr004,
    fr005,
    fr006,
    fr007,
    fr008,
    fr009,
    fr010,
    fr011,
  ];
};
