export const RNG_SEED = "crewday-demo-v1";
export const SEED_REFERENCE_ISO = "2026-10-25T12:00:00.000Z";
export const HISTORY_DAYS = 90;

/** Curated Crewday demonstration dataset (see docs/specs/crewday-demo-fidelity.md). */
export const TOTAL_REQUESTS = 80;

export const STATUS_COUNTS = {
  archived: 1,
  draft: 4,
  pending_confirm: 1,
  published: 73,
  triaging: 1,
} as const;

export const OPEN_QUEUE_COUNT = 13;

export const DISPOSITION_COUNTS = {
  decline: 10,
  merge: 6,
  monitor: 26,
  needs_discussion: 18,
} as const;

export const PUBLISHED_DISPOSITIONED = 60;
export const INTAKE_LINKS_COUNT = 4;
export const DUPLICATE_CANDIDATES_COUNT = 20;
export const MIN_INTAKE_LINKS = INTAKE_LINKS_COUNT;
export const MIN_DUPLICATE_CANDIDATES = DUPLICATE_CANDIDATES_COUNT;
export const MIN_PM_REVIEW_STARTED = 60;

export const BULK_REQUEST_ID_PREFIX = "00000000-0000-5000-8000-";

export const DISPOSITION_RATIONALE_MIN_LENGTH = 24;

export const THEME_MIN_PUBLISHED = {
  availability_time_off: 9,
  mobile_reliability: 9,
  notifications: 9,
  permissions_compliance: 9,
  reporting_operations: 9,
  scheduling_coverage: 10,
  shift_swaps: 9,
  time_tracking_payroll: 9,
} as const;

export const CREWDAY_THEME_KEYS = [
  ...Object.keys(THEME_MIN_PUBLISHED),
  "platform_other",
] as const;
