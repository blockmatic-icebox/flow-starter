import {
  CREWDAY_ORGANIZATIONS,
  CREWDAY_PERSONAS,
  supporterKeyFor,
} from "../crewday-scenario";
import type { CrewdayOrganizationKey } from "../crewday-scenario";
import { SEED_REFERENCE_ISO } from "../manifest";
import type { CrewdayDemoContext, SeedRequestRow } from "../types";

const ref = new Date(SEED_REFERENCE_ISO);

export const daysAgo = (days: number) =>
  new Date(ref.getTime() - days * 24 * 60 * 60 * 1000);

export const id = (suffix: string) =>
  `00000000-0000-4000-8000-00000000${suffix}`;

export const demoContext = ({
  orgKey,
  personaKey,
}: {
  orgKey: CrewdayOrganizationKey;
  personaKey: keyof typeof CREWDAY_PERSONAS;
}): CrewdayDemoContext => ({
  accountLabel: CREWDAY_ORGANIZATIONS[orgKey].label,
  organizationKey: orgKey,
  personaKey,
  submitterRole: CREWDAY_PERSONAS[personaKey].role,
});

export const supporters = (
  entries: {
    orgKey: CrewdayOrganizationKey;
    personaKey: keyof typeof CREWDAY_PERSONAS;
  }[]
) => entries.map((e) => supporterKeyFor(e));

interface PublishedInput {
  canonicalRequestId?: string | null;
  daysAgo: number;
  decisionBrief?: string | null;
  demoCtx: CrewdayDemoContext;
  description: string;
  disposition?: SeedRequestRow["disposition"];
  dispositionRationale?: string | null;
  duplicateCandidates?: SeedRequestRow["duplicateCandidates"];
  intakeLinkedRequestId?: string | null;
  mergeTargetId?: string | null;
  problemStatement: string;
  requestId: string;
  scenarioTag: string;
  source: SeedRequestRow["source"];
  supporterEntries?: {
    orgKey: CrewdayOrganizationKey;
    personaKey: keyof typeof CREWDAY_PERSONAS;
  }[];
  themeKey: string;
  title: string;
}

export const publishedRow = ({
  canonicalRequestId,
  daysAgo: submittedDays,
  decisionBrief,
  demoCtx,
  description,
  disposition,
  dispositionRationale,
  duplicateCandidates,
  intakeLinkedRequestId,
  mergeTargetId,
  problemStatement,
  requestId,
  scenarioTag,
  source,
  supporterEntries = [],
  themeKey,
  title,
}: PublishedInput): SeedRequestRow => {
  const submittedAt = daysAgo(submittedDays);
  const triageCompletedAt = daysAgo(Math.max(0, submittedDays - 1));
  const publishedAt = daysAgo(Math.max(0, submittedDays - 1));
  const dispositionAt = disposition
    ? daysAgo(Math.max(0, submittedDays - 3))
    : null;
  const pmReviewStartedAt =
    disposition && dispositionAt
      ? new Date(dispositionAt.getTime() - 20 * 60 * 1000)
      : null;
  const keys = supporters(supporterEntries);

  return {
    canonicalRequestId: canonicalRequestId ?? null,
    decisionBrief: decisionBrief ?? null,
    demoContext: demoCtx,
    description,
    disposition: disposition ?? null,
    dispositionAt,
    dispositionRationale: dispositionRationale ?? null,
    duplicateCandidates,
    id: requestId,
    intakeLinkedRequestId: intakeLinkedRequestId ?? null,
    mergeTargetId: mergeTargetId ?? null,
    pmReviewStartedAt,
    problemStatement,
    publishedAt,
    scenarioTag,
    source,
    status: "published",
    submittedAt,
    supportCount: keys.length,
    supporterKeys: keys.length > 0 ? keys : undefined,
    themeKey,
    title,
    triageCompletedAt,
  };
};

export const draftRow = ({
  daysAgo: submittedDays,
  demoCtx,
  description,
  problemStatement,
  requestId,
  scenarioTag,
  source,
  themeKey,
  title,
}: {
  daysAgo: number;
  demoCtx: CrewdayDemoContext;
  description: string;
  problemStatement: string;
  requestId: string;
  scenarioTag: string;
  source: SeedRequestRow["source"];
  themeKey: string;
  title: string;
}): SeedRequestRow => ({
  demoContext: demoCtx,
  description,
  id: requestId,
  problemStatement,
  scenarioTag,
  source,
  status: "draft",
  submittedAt: daysAgo(submittedDays),
  supportCount: 0,
  themeKey,
  title,
});

export const triagingRow = ({
  daysAgo: submittedDays,
  demoCtx,
  description,
  problemStatement,
  requestId,
  scenarioTag,
  source,
  themeKey,
  title,
}: {
  daysAgo: number;
  demoCtx: CrewdayDemoContext;
  description: string;
  problemStatement: string;
  requestId: string;
  scenarioTag: string;
  source: SeedRequestRow["source"];
  themeKey: string;
  title: string;
}): SeedRequestRow => ({
  demoContext: demoCtx,
  description,
  id: requestId,
  problemStatement,
  scenarioTag,
  source,
  status: "triaging",
  submittedAt: daysAgo(submittedDays),
  supportCount: 0,
  themeKey,
  title,
});

export const archivedRow = ({
  daysAgo: submittedDays,
  demoCtx,
  description,
  problemStatement,
  requestId,
  scenarioTag,
  source,
  themeKey,
  title,
}: {
  daysAgo: number;
  demoCtx: CrewdayDemoContext;
  description: string;
  problemStatement: string;
  requestId: string;
  scenarioTag: string;
  source: SeedRequestRow["source"];
  themeKey: string;
  title: string;
}): SeedRequestRow => ({
  demoContext: demoCtx,
  description,
  id: requestId,
  problemStatement,
  scenarioTag,
  source,
  status: "archived",
  submittedAt: daysAgo(submittedDays),
  supportCount: 0,
  themeKey,
  title,
});

export const pendingConfirmRow = ({
  daysAgo: submittedDays,
  decisionBrief,
  demoCtx,
  description,
  duplicateCandidates,
  problemStatement,
  requestId,
  scenarioTag,
  source,
  themeKey,
  title,
}: {
  daysAgo: number;
  decisionBrief?: string;
  demoCtx: CrewdayDemoContext;
  description: string;
  duplicateCandidates?: SeedRequestRow["duplicateCandidates"];
  problemStatement: string;
  requestId: string;
  scenarioTag: string;
  source: SeedRequestRow["source"];
  themeKey: string;
  title: string;
}): SeedRequestRow => {
  const submittedAt = daysAgo(submittedDays);
  return {
    decisionBrief: decisionBrief ?? null,
    demoContext: demoCtx,
    description,
    duplicateCandidates,
    id: requestId,
    problemStatement,
    scenarioTag,
    source,
    status: "pending_confirm",
    submittedAt,
    supportCount: 0,
    themeKey,
    title,
    triageCompletedAt: daysAgo(Math.max(0, submittedDays - 1)),
  };
};
