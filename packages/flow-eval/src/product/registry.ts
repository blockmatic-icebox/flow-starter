import type { RequirementRecord } from "./types.ts";

export const starterRequirements = (): RequirementRecord[] => [
  {
    requirementId: "STARTER-001",
    releaseBlocking: true,
    source: "apps/web neutral starter contract",
    title: "Product starter homepage is domain-neutral",
    verification: [{ caseId: "web-starter-unit", kind: "unit" }],
  },
  {
    requirementId: "STARTER-002",
    releaseBlocking: true,
    source: "apps/web/tests/browser/smoke.spec.ts",
    title: "No obsolete Feature Intelligence routes",
    verification: [{ caseId: "web-starter-browser", kind: "browser" }],
  },
  {
    nonGoal: true,
    requirementId: "STARTER-NG-001",
    releaseBlocking: false,
    source: "PRODUCT.md non-goals",
    title: "Feature Intelligence product in apps/web",
    verification: [],
  },
];

export type AllowlistedCase = {
  caseId: string;
  command: string;
  cwd?: "repo";
  kind: "unit" | "integration" | "browser" | "security";
  expected: string;
  requirementIds: string[];
};

export const allowlistedCases = (): AllowlistedCase[] => [
  {
    caseId: "web-starter-unit",
    command: "pnpm --filter web test",
    cwd: "repo",
    expected: "web starter contract tests pass",
    kind: "unit",
    requirementIds: ["STARTER-001"],
  },
  {
    caseId: "web-starter-browser",
    command: "pnpm --filter web test:browser",
    cwd: "repo",
    expected: "starter browser smoke passes",
    kind: "browser",
    requirementIds: ["STARTER-002"],
  },
  {
    caseId: "flow-eval-unit",
    command: "pnpm --filter @repo/flow-eval test",
    cwd: "repo",
    expected: "flow-eval unit suite passes",
    kind: "unit",
    requirementIds: [],
  },
];
