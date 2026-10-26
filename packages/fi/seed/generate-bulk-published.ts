import { ANCHOR_IDS } from "./anchors";
import {
  BULK_OPEN_COUNT,
  HISTORY_DAYS,
  MIN_INTAKE_LINKS,
  STATUS_COUNTS,
} from "./manifest";
import { pick } from "./prng";
import type { SeedRequestRow } from "./types";

type Rng = () => number;
type AddRow = (partial: Omit<SeedRequestRow, "id"> & { id?: string }) => string;
type At = (daysAgo: number) => Date;

const buildPublishedRow = ({
  at,
  canonicalIds,
  disposition,
  dispositionRationales,
  i,
  intakeCount,
  isOpen,
  rng,
  themeKey,
  vagueTitles,
}: {
  at: At;
  canonicalIds: string[];
  disposition: SeedRequestRow["disposition"];
  dispositionRationales: Record<string, string[]>;
  i: number;
  intakeCount: number;
  isOpen: boolean;
  rng: Rng;
  themeKey: string;
  vagueTitles: string[];
}) => {
  const emerging =
    themeKey === "mobile_experience" || themeKey === "permissions_access";
  const daysAgo =
    emerging && rng() < 0.6
      ? Math.floor(rng() * 30)
      : Math.floor(rng() * HISTORY_DAYS);
  const submitted = at(daysAgo);
  const published = at(Math.max(0, daysAgo - 1));
  const triageDone = at(Math.max(0, daysAgo - 1));
  const dispositioned = disposition ? at(Math.max(0, daysAgo - 3)) : null;
  const title =
    vagueTitles[i] ?? `${themeKey.replaceAll("_", " ")} request ${i}`;

  const supportCount = (() => {
    let count = isOpen
      ? Math.floor(rng() * 18) + 1
      : Math.floor(rng() * 25) + 1;
    const strategic = disposition === "decline" || disposition === "monitor";
    if (strategic && i % 17 === 0) count = 20 + Math.floor(rng() * 12);
    return count;
  })();

  const intakeLinkedRequestId =
    intakeCount < MIN_INTAKE_LINKS && (rng() < 0.22 || i < 5)
      ? pick(rng, [
          ANCHOR_IDS.fr001,
          ANCHOR_IDS.fr002,
          ANCHOR_IDS.fr005,
          ...canonicalIds,
        ])
      : null;

  const mergeTargetId =
    disposition === "merge" ? pick(rng, canonicalIds) : null;
  const canonicalRequestId =
    disposition === "merge" && i % 3 === 0 && canonicalIds.length > 0
      ? pick(rng, canonicalIds)
      : null;

  return {
    canonicalRequestId,
    decisionBrief: isOpen
      ? `Open queue brief for ${title}.`
      : `Closed: ${disposition}.`,
    description: `${title} — bulk seeded description.`,
    disposition,
    dispositionAt: dispositioned,
    dispositionRationale: disposition
      ? pick(
          rng,
          dispositionRationales[disposition] ?? ["PM decision recorded."]
        )
      : null,
    intakeLinkedRequestId,
    mergeTargetId,
    pmReviewStartedAt:
      disposition && dispositioned
        ? new Date(
            dispositioned.getTime() - (20 + Math.floor(rng() * 40)) * 60 * 1000
          )
        : null,
    problemStatement: `Problem context for ${title}`,
    publishedAt: published,
    source: pick(rng, ["customer", "prospect", "support", "internal"] as const),
    status: "published" as const,
    submittedAt: submitted,
    supportCount,
    themeKey,
    title,
    triageCompletedAt: triageDone,
  };
};

export const generateBulkPublished = ({
  addRow,
  at,
  canonicalIds,
  dispositionRationales,
  rng,
  shuffledDispositions,
  themeKeys,
  themeQueue,
  vagueTitles,
}: {
  addRow: AddRow;
  at: At;
  canonicalIds: string[];
  dispositionRationales: Record<string, string[]>;
  rng: Rng;
  shuffledDispositions: SeedRequestRow["disposition"][];
  themeKeys: string[];
  themeQueue: string[];
  vagueTitles: string[];
}) => {
  const publishedBulk = STATUS_COUNTS.published - 10;
  const openBulk = BULK_OPEN_COUNT;
  let intakeCount = 2;

  for (let i = 0; i < publishedBulk; i += 1) {
    const isOpen = i < openBulk;
    const disposition = isOpen
      ? null
      : (shuffledDispositions[i - openBulk] ?? "monitor");
    const themeKey = themeQueue[i] ?? pick(rng, themeKeys);

    const partial = buildPublishedRow({
      at,
      canonicalIds,
      disposition,
      dispositionRationales,
      i,
      intakeCount,
      isOpen,
      rng,
      themeKey,
      vagueTitles,
    });

    if (partial.intakeLinkedRequestId) intakeCount += 1;

    const id = addRow(partial);
    if (!isOpen && disposition !== "merge") canonicalIds.push(id);
  }
};
