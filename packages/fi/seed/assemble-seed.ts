import { availabilityTimeOffRows } from "./fixtures/availability-time-off";
import { lifecycleRows } from "./fixtures/lifecycle";
import { mobileReliabilityRows } from "./fixtures/mobile-reliability";
import { notificationsRows } from "./fixtures/notifications";
import { permissionsComplianceRows } from "./fixtures/permissions-compliance";
import { reportingOperationsRows } from "./fixtures/reporting-operations";
import { schedulingCoverageRows } from "./fixtures/scheduling-coverage";
import { shiftSwapsRows } from "./fixtures/shift-swaps";
import { timeTrackingPayrollRows } from "./fixtures/time-tracking-payroll";
import type {
  CrewdayDemoContext,
  GeneratedSeed,
  SeedDuplicateRow,
  SeedRequestRow,
} from "./types";

const collectScenarioRows = (): SeedRequestRow[] => [
  ...schedulingCoverageRows(),
  ...shiftSwapsRows(),
  ...availabilityTimeOffRows(),
  ...notificationsRows(),
  ...timeTrackingPayrollRows(),
  ...permissionsComplianceRows(),
  ...mobileReliabilityRows(),
  ...reportingOperationsRows(),
  ...lifecycleRows(),
];

const flattenDuplicateCandidates = (
  requests: SeedRequestRow[]
): SeedDuplicateRow[] => {
  const edges: SeedDuplicateRow[] = [];
  for (const row of requests) {
    for (const candidate of row.duplicateCandidates ?? []) {
      edges.push({ ...candidate, requestId: row.id });
    }
  }
  return edges;
};

let cachedContextMap: Map<string, CrewdayDemoContext> | null = null;

const buildDemoContextMap = (requests: SeedRequestRow[]) => {
  const map = new Map<string, CrewdayDemoContext>();
  for (const row of requests) {
    if (row.demoContext) map.set(row.id, row.demoContext);
  }
  return map;
};

export const assembleCrewdaySeed = (): GeneratedSeed => {
  const requests = collectScenarioRows();
  cachedContextMap = buildDemoContextMap(requests);
  return {
    duplicateCandidates: flattenDuplicateCandidates(requests),
    requests,
  };
};

export const getCrewdayDemoContextByRequestId = (): ReadonlyMap<
  string,
  CrewdayDemoContext
> => {
  if (!cachedContextMap) {
    cachedContextMap = buildDemoContextMap(collectScenarioRows());
  }
  return cachedContextMap;
};

export const countCrewdayOpenQueue = (requests: SeedRequestRow[]) =>
  requests.filter((r) => r.status === "published" && !r.disposition).length;
