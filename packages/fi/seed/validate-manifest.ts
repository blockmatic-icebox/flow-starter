import { themeRegistry } from "../src/theme/registry";
import {
  BULK_REQUEST_ID_PREFIX,
  DISPOSITION_COUNTS,
  DISPOSITION_RATIONALE_MIN_LENGTH,
  DUPLICATE_CANDIDATES_COUNT,
  INTAKE_LINKS_COUNT,
  OPEN_QUEUE_COUNT,
  STATUS_COUNTS,
  THEME_MIN_PUBLISHED,
  TOTAL_REQUESTS,
} from "./manifest";
import type { GeneratedSeed, SeedRequestRow } from "./types";

const PLACEHOLDER_PATTERNS = [
  /bulk seeded/iu,
  /seeded anchor description/iu,
  /Request #\d+/u,
  /Archived idea #/u,
  /Draft note \d+/u,
  /^Eval merge/u,
];

const themeKeys = new Set(Object.keys(themeRegistry));

const pushIfMismatch = ({
  actual,
  errors,
  expected,
  label,
}: {
  actual: number;
  errors: string[];
  expected: number;
  label: string;
}) => {
  if (actual !== expected) {
    errors.push(`${label}: expected ${expected}, got ${actual}`);
  }
};

const validateRequestContent = (row: SeedRequestRow, errors: string[]) => {
  if (row.id.startsWith(BULK_REQUEST_ID_PREFIX)) {
    errors.push(`bulk-generated id not allowed: ${row.id}`);
  }
  if (!row.title?.trim() || row.title.length < 8) {
    errors.push(`title too short: ${row.id}`);
  }
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(row.title) || pattern.test(row.description)) {
      errors.push(`placeholder content on ${row.id}: ${row.title}`);
    }
  }
  if (!themeKeys.has(row.themeKey)) {
    errors.push(`unknown theme_key ${row.themeKey} on ${row.id}`);
  }
};

const validateRequestSupporters = (row: SeedRequestRow, errors: string[]) => {
  if (!row.supporterKeys?.length) return;
  if (row.supportCount !== row.supporterKeys.length) {
    errors.push(
      `support_count mismatch on ${row.id}: ${row.supportCount} vs ${row.supporterKeys.length} keys`
    );
  }
  if (new Set(row.supporterKeys).size !== row.supporterKeys.length) {
    errors.push(`duplicate supporter keys on ${row.id}`);
  }
};

const validateRequestRelations = ({
  errors,
  ids,
  row,
}: {
  errors: string[];
  ids: Set<string>;
  row: SeedRequestRow;
}) => {
  if (row.mergeTargetId && !ids.has(row.mergeTargetId)) {
    errors.push(`merge target missing for ${row.id}`);
  }
  if (row.mergeTargetId === row.id) {
    errors.push(`self merge target on ${row.id}`);
  }
  if (
    row.disposition &&
    (!row.dispositionRationale ||
      row.dispositionRationale.length < DISPOSITION_RATIONALE_MIN_LENGTH)
  ) {
    errors.push(`weak disposition rationale on ${row.id}`);
  }
};

const validateRequestTimestamps = (row: SeedRequestRow, errors: string[]) => {
  if (row.submittedAt && row.publishedAt && row.publishedAt < row.submittedAt) {
    errors.push(`published before submitted on ${row.id}`);
  }
  if (
    row.publishedAt &&
    row.dispositionAt &&
    row.dispositionAt < row.publishedAt
  ) {
    errors.push(`disposition before published on ${row.id}`);
  }
};

const validateRequestRow = ({
  errors,
  ids,
  row,
}: {
  errors: string[];
  ids: Set<string>;
  row: SeedRequestRow;
}) => {
  validateRequestContent(row, errors);
  validateRequestSupporters(row, errors);
  validateRequestRelations({ errors, ids, row });
  validateRequestTimestamps(row, errors);
};

const validateRowDuplicateCandidates = ({
  errors,
  ids,
  row,
}: {
  errors: string[];
  ids: Set<string>;
  row: SeedRequestRow;
}) => {
  for (const edge of row.duplicateCandidates ?? []) {
    if (!ids.has(edge.candidateRequestId)) {
      errors.push(
        `duplicate candidate missing target ${edge.candidateRequestId} from ${row.id}`
      );
    }
    if (edge.candidateRequestId === row.id) {
      errors.push(`self duplicate edge on ${row.id}`);
    }
  }
};

const validateSemantics = (requests: SeedRequestRow[], errors: string[]) => {
  const ids = new Set(requests.map((r) => r.id));
  for (const row of requests) {
    validateRequestRow({ errors, ids, row });
  }
  for (const row of requests) {
    validateRowDuplicateCandidates({ errors, ids, row });
  }
};

const validateManifestCounts = ({
  duplicateCandidates,
  errors,
  requests,
}: Pick<GeneratedSeed, "duplicateCandidates" | "requests"> & {
  errors: string[];
}) => {
  pushIfMismatch({
    actual: requests.length,
    errors,
    expected: TOTAL_REQUESTS,
    label: `request count`,
  });

  const statusCounts: Record<string, number> = {};
  for (const r of requests) {
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
  }
  for (const [status, expected] of Object.entries(STATUS_COUNTS)) {
    pushIfMismatch({
      actual: statusCounts[status] ?? 0,
      errors,
      expected,
      label: `status ${status}`,
    });
  }

  const dispositionCounts: Record<string, number> = {};
  for (const r of requests) {
    if (!r.disposition) continue;
    dispositionCounts[r.disposition] =
      (dispositionCounts[r.disposition] ?? 0) + 1;
  }
  for (const [disposition, expected] of Object.entries(DISPOSITION_COUNTS)) {
    pushIfMismatch({
      actual: dispositionCounts[disposition] ?? 0,
      errors,
      expected,
      label: `disposition ${disposition}`,
    });
  }

  const openQueue = requests.filter(
    (r) => r.status === "published" && !r.disposition
  ).length;
  pushIfMismatch({
    actual: openQueue,
    errors,
    expected: OPEN_QUEUE_COUNT,
    label: "open queue",
  });

  const intakeLinks = requests.filter(
    (r) => r.status === "published" && r.intakeLinkedRequestId
  ).length;
  pushIfMismatch({
    actual: intakeLinks,
    errors,
    expected: INTAKE_LINKS_COUNT,
    label: "intake links",
  });

  pushIfMismatch({
    actual: duplicateCandidates.length,
    errors,
    expected: DUPLICATE_CANDIDATES_COUNT,
    label: "duplicate candidates",
  });
};

const validateDuplicateCandidateTable = ({
  duplicateCandidates,
  errors,
  requestIds,
}: {
  duplicateCandidates: GeneratedSeed["duplicateCandidates"];
  errors: string[];
  requestIds: Set<string>;
}) => {
  for (const edge of duplicateCandidates) {
    if (!requestIds.has(edge.requestId)) {
      errors.push(`duplicate edge: unknown requestId ${edge.requestId}`);
    }
    if (!requestIds.has(edge.candidateRequestId)) {
      errors.push(
        `duplicate edge: unknown candidateRequestId ${edge.candidateRequestId}`
      );
    }
  }
};

const validateThemeMinimums = (
  requests: SeedRequestRow[],
  errors: string[]
) => {
  const publishedByTheme: Record<string, number> = {};
  for (const r of requests) {
    if (r.status !== "published") continue;
    publishedByTheme[r.themeKey] = (publishedByTheme[r.themeKey] ?? 0) + 1;
  }
  for (const [key, min] of Object.entries(THEME_MIN_PUBLISHED)) {
    const actual = publishedByTheme[key] ?? 0;
    if (actual < min) {
      errors.push(`theme ${key}: expected >= ${min} published, got ${actual}`);
    }
  }
};

export const validateGeneratedSeed = ({
  duplicateCandidates,
  requests,
}: GeneratedSeed) => {
  const errors: string[] = [];
  const requestIds = new Set(requests.map((r) => r.id));

  validateManifestCounts({ duplicateCandidates, errors, requests });
  validateDuplicateCandidateTable({
    duplicateCandidates,
    errors,
    requestIds,
  });
  validateThemeMinimums(requests, errors);
  validateSemantics(requests, errors);

  return { errors, ok: errors.length === 0 };
};
