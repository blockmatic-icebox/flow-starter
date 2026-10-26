import { createHash } from "node:crypto";

import { ANCHOR_IDS, buildAnchorRows } from "./anchors";
import { generateBulkPublished } from "./generate-bulk-published";
import {
  DISPOSITION_COUNTS,
  HISTORY_DAYS,
  MIN_DUPLICATE_CANDIDATES,
  RNG_SEED,
  SEED_REFERENCE_ISO,
  STATUS_COUNTS,
  THEME_MIN_PUBLISHED,
} from "./manifest";
import { bulkId, createRng, pick } from "./prng";
import type {
  GeneratedSeed,
  SeedDuplicateCandidate,
  SeedRequestRow,
} from "./types";

const ref = new Date(SEED_REFERENCE_ISO);
const at = (daysAgo: number) =>
  new Date(ref.getTime() - daysAgo * 24 * 60 * 60 * 1000);

const sources = ["customer", "prospect", "support", "internal"] as const;

const themeKeys = Object.keys(
  THEME_MIN_PUBLISHED
) as (keyof typeof THEME_MIN_PUBLISHED)[];

const vagueTitles = [
  "Make reports better",
  "Improve dashboard experience",
  "Analytics feels slow sometimes",
  "Need better sharing",
  "Fix the export thing",
  "Hard to find metrics",
  "Want more flexibility",
  "Confusing filters UI",
  "Better mobile please",
  "Alerts are noisy",
];

const dispositionRationales: Record<string, string[]> = {
  decline: [
    "High votes but out of strategic focus this half.",
    "Duplicate effort; track under existing CSV thread.",
    "Vendor roadmap already covers this workflow.",
  ],
  merge: ["Consolidated into canonical request for PM review."],
  monitor: [
    "Valuable; waiting for signal from related exports work.",
    "Defer until permissions model ships.",
  ],
  needs_discussion: [
    "Needs eng spike on feasibility.",
    "Conflicting asks from enterprise accounts.",
  ],
};

const buildDispositionSlots = () => {
  const slots: SeedRequestRow["disposition"][] = [];
  const bulkDisposition = {
    decline: DISPOSITION_COUNTS.decline - 1,
    merge: DISPOSITION_COUNTS.merge,
    monitor: DISPOSITION_COUNTS.monitor - 1,
    needs_discussion: DISPOSITION_COUNTS.needs_discussion,
  };
  for (const [disp, count] of Object.entries(bulkDisposition)) {
    for (let i = 0; i < count; i += 1) {
      slots.push(disp as SeedRequestRow["disposition"]);
    }
  }
  return slots;
};

const anchorPublishedForTheme = (key: string) => {
  if (key === "reporting_exports") return 4;
  if (key === "collaboration_sharing") return 4;
  if (key === "integrations_alerts") return 2;
  return 0;
};

export const generateBulkRows = (): SeedRequestRow[] => {
  const rng = createRng(RNG_SEED);
  const rows: SeedRequestRow[] = [];
  let bulkIndex = 0;

  const nextId = () => {
    bulkIndex += 1;
    return bulkId(bulkIndex);
  };

  const dispositionSlots = buildDispositionSlots();
  const shuffledDispositions = dispositionSlots.toSorted(() => rng() - 0.5);

  const addRow = (partial: Omit<SeedRequestRow, "id"> & { id?: string }) => {
    const id = partial.id ?? nextId();
    rows.push({ ...partial, id });
    return id;
  };

  for (let i = 0; i < STATUS_COUNTS.archived; i += 1) {
    const daysAgo = Math.floor(rng() * HISTORY_DAYS);
    addRow({
      description: `Archived request ${i} — historical noise.`,
      problemStatement: "Low priority archived item.",
      publishedAt: at(daysAgo),
      source: pick(rng, sources),
      status: "archived",
      submittedAt: at(daysAgo + 1),
      supportCount: Math.floor(rng() * 3),
      themeKey: pick(rng, themeKeys),
      title: `Archived idea #${i}`,
      triageCompletedAt: at(daysAgo),
    });
  }

  for (let i = 0; i < STATUS_COUNTS.draft; i += 1) {
    addRow({
      description: `Draft ${i} — not yet submitted.`,
      problemStatement: "Draft problem.",
      source: pick(rng, sources),
      status: "draft",
      submittedAt: at(Math.floor(rng() * 14)),
      supportCount: 0,
      themeKey: pick(rng, themeKeys),
      title: `Draft note ${i}`,
    });
  }

  for (let i = 0; i < STATUS_COUNTS.triaging; i += 1) {
    const daysAgo = Math.floor(rng() * 7);
    addRow({
      description: `Triaging ${i} — harness in progress.`,
      problemStatement: "In-flight triage.",
      source: pick(rng, sources),
      status: "triaging",
      submittedAt: at(daysAgo),
      supportCount: 0,
      themeKey: pick(rng, themeKeys),
      title: `In-flight submit ${i}`,
    });
  }

  const publishedBulk = STATUS_COUNTS.published - 10;

  const themeQueue: string[] = [];
  for (const [key, min] of Object.entries(THEME_MIN_PUBLISHED)) {
    const need = Math.max(0, min - anchorPublishedForTheme(key));
    for (let n = 0; n < need; n += 1) themeQueue.push(key);
  }
  while (themeQueue.length < publishedBulk) {
    themeQueue.push(pick(rng, themeKeys));
  }
  themeQueue.length = publishedBulk;

  const canonicalIds: string[] = [
    ANCHOR_IDS.fr001,
    ANCHOR_IDS.fr005,
    ANCHOR_IDS.fr007,
  ];

  generateBulkPublished({
    addRow,
    at,
    canonicalIds,
    dispositionRationales,
    rng,
    shuffledDispositions,
    themeKeys,
    themeQueue,
    vagueTitles,
  });

  return rows;
};

export const generateSeed = (): GeneratedSeed => {
  const anchors = buildAnchorRows();
  const bulk = generateBulkRows();
  const requests = [...anchors, ...bulk];

  const duplicateCandidates: (SeedDuplicateCandidate & {
    requestId: string;
  })[] = [];

  for (const row of anchors) {
    for (const c of row.duplicateCandidates ?? []) {
      duplicateCandidates.push({ ...c, requestId: row.id });
    }
  }

  const published = requests.filter((r) => r.status === "published");
  for (
    let i = 0;
    i < published.length - 1 &&
    duplicateCandidates.length < MIN_DUPLICATE_CANDIDATES;
    i += 1
  ) {
    const a = published[i];
    const b = published[(i + 3) % published.length];
    if (!a || !b || a.id === b.id) continue;
    duplicateCandidates.push({
      candidateRequestId: b.id,
      explanation: "Generator duplicate edge",
      requestId: a.id,
      score: 0.6 + (i % 35) * 0.01,
    });
  }

  return { duplicateCandidates, requests };
};

export const bulkIdHash = () => {
  const bulk = generateBulkRows();
  const ids = bulk
    .map((r) => r.id)
    .toSorted()
    .join(",");
  return createHash("sha256").update(ids).digest("hex").slice(0, 16);
};
