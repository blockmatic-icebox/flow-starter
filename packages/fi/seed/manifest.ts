export const RNG_SEED = "fi-demo-v1";
export const SEED_REFERENCE_ISO = "2026-10-25T12:00:00.000Z";
export const HISTORY_DAYS = 90;

export const TOTAL_REQUESTS = 500;
export const ANCHOR_COUNT = 11;
export const BULK_COUNT = TOTAL_REQUESTS - ANCHOR_COUNT;

export const STATUS_COUNTS = {
  archived: 20,
  draft: 12,
  pending_confirm: 1,
  published: 462,
  triaging: 5,
} as const;

export const OPEN_QUEUE_COUNT = 50;
export const ANCHOR_OPEN_COUNT = 8;
export const BULK_OPEN_COUNT = OPEN_QUEUE_COUNT - ANCHOR_OPEN_COUNT;

export const DISPOSITION_COUNTS = {
  decline: 95,
  merge: 85,
  monitor: 120,
  needs_discussion: 112,
} as const;

export const PUBLISHED_DISPOSITIONED = 412;
export const MIN_INTAKE_LINKS = 90;
export const MIN_DUPLICATE_CANDIDATES = 180;
export const MIN_PM_REVIEW_STARTED = 200;
export const MERGE_CANONICAL_VICTIMS = 40;

export const THEME_MIN_PUBLISHED = {
  collaboration_sharing: 75,
  data_governance: 40,
  integrations_alerts: 60,
  mobile_experience: 45,
  performance_scale: 50,
  permissions_access: 55,
  reporting_exports: 80,
} as const;

/** SHA-256 first 16 hex chars of sorted bulk ids — update if bulk generation changes */
export const GENERATED_BULK_ID_HASH = "4369a9066558c9c2";
