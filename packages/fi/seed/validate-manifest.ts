import {
  MIN_DUPLICATE_CANDIDATES,
  MIN_INTAKE_LINKS,
  OPEN_QUEUE_COUNT,
  STATUS_COUNTS,
  TOTAL_REQUESTS,
} from "./manifest";
import type { GeneratedSeed } from "./types";

export const validateGeneratedSeed = ({
  duplicateCandidates,
  requests,
}: GeneratedSeed) => {
  const errors: string[] = [];

  if (requests.length !== TOTAL_REQUESTS) {
    errors.push(`expected ${TOTAL_REQUESTS} requests, got ${requests.length}`);
  }

  const statusCounts: Record<string, number> = {};
  for (const r of requests) {
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
  }

  for (const [status, expected] of Object.entries(STATUS_COUNTS)) {
    const actual = statusCounts[status] ?? 0;
    if (actual !== expected) {
      errors.push(`status ${status}: expected ${expected}, got ${actual}`);
    }
  }

  const openQueue = requests.filter(
    (r) => r.status === "published" && !r.disposition
  ).length;
  if (openQueue !== OPEN_QUEUE_COUNT) {
    errors.push(`open queue: expected ${OPEN_QUEUE_COUNT}, got ${openQueue}`);
  }

  const intakeLinks = requests.filter(
    (r) => r.status === "published" && r.intakeLinkedRequestId
  ).length;
  if (intakeLinks < MIN_INTAKE_LINKS) {
    errors.push(
      `intake links: expected >= ${MIN_INTAKE_LINKS}, got ${intakeLinks}`
    );
  }

  if (duplicateCandidates.length < MIN_DUPLICATE_CANDIDATES) {
    errors.push(
      `duplicate candidates: expected >= ${MIN_DUPLICATE_CANDIDATES}, got ${duplicateCandidates.length}`
    );
  }

  return { errors, ok: errors.length === 0 };
};
