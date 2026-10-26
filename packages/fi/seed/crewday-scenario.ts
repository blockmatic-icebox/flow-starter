/**
 * Crewday demonstration product canon — synthetic workforce scheduling for
 * multi-location restaurants and retail. All customer feedback in the FI seed
 * references this fictional product; provenance is authored demo data only.
 */

export const CREWDAY_PRODUCT_NAME = "Crewday";

export const crewdayDemoBlurb =
  "Crewday helps multi-location restaurants and retailers manage employee schedules, shift swaps, coverage, availability, and labor coordination.";

export const CREWDAY_BUSINESS_PRIORITIES = [
  "Shift coverage reliability — fill gaps before service is impacted",
  "Employee scheduling accuracy — everyone sees the same approved schedule",
  "Reduced scheduling administration — less manual texting and spreadsheet work",
  "Labor and payroll correctness — approved changes reach payroll exports",
  "Compliance and appropriate manager controls — scoped access and policy guardrails",
  "Customer retention and expansion — remove operational blockers for multi-site operators",
] as const;

export const CREWDAY_ORGANIZATIONS = {
  "coast-services": {
    key: "coast-services",
    label: "Coast Services (janitorial crews)",
    segment: "field services",
  },
  "harbor-bites": {
    key: "harbor-bites",
    label: "Harbor Bites (fast casual, 12 locations)",
    segment: "restaurant",
  },
  "norte-retail": {
    key: "norte-retail",
    label: "Norte Retail (28 stores)",
    segment: "retail",
  },
  "prairie-foods": {
    key: "prairie-foods",
    label: "Prairie Foods (grocery)",
    segment: "grocery",
  },
  "summit-hospitality": {
    key: "summit-hospitality",
    label: "Summit Hospitality (hotels + F&B)",
    segment: "hospitality",
  },
  "vida-cafe": {
    key: "vida-cafe",
    label: "Vida Café (coffee chain)",
    segment: "restaurant",
  },
} as const;

export type CrewdayOrganizationKey = keyof typeof CREWDAY_ORGANIZATIONS;

export const CREWDAY_PERSONAS = {
  "aisha-cole": {
    key: "aisha-cole",
    label: "Aisha Cole",
    role: "Regional operations director",
  },
  "derek-payroll": {
    key: "derek-payroll",
    label: "Derek Ngo",
    role: "Payroll administrator",
  },
  "jen-park": {
    key: "jen-park",
    label: "Jen Park",
    role: "Store manager",
  },
  "lucia-hr": {
    key: "lucia-hr",
    label: "Lucía Mendoza",
    role: "HR & compliance lead",
  },
  "marco-ruiz": {
    key: "marco-ruiz",
    label: "Marco Ruiz",
    role: "Line cook",
  },
  "morgan-pm": {
    key: "morgan-pm",
    label: "Morgan Ellis",
    role: "Internal Crewday PM",
  },
  "priya-sales": {
    key: "priya-sales",
    label: "Priya Shah",
    role: "Account executive",
  },
  "sam-support": {
    key: "sam-support",
    label: "Sam Ortiz",
    role: "Crewday support specialist",
  },
  "tom-franchise": {
    key: "tom-franchise",
    label: "Tom Brennan",
    role: "Franchise owner-operator",
  },
  "yuki-student": {
    key: "yuki-student",
    label: "Yuki Tanaka",
    role: "Part-time barista",
  },
} as const;

/** Stable supporter keys used in seed fixtures (`feature_request_support.supporter_key`). */
export const supporterKeyFor = ({
  orgKey,
  personaKey,
}: {
  orgKey: CrewdayOrganizationKey;
  personaKey: keyof typeof CREWDAY_PERSONAS;
}) => `cd-${orgKey}-${personaKey}`;

const supporterOrgMap: Record<string, CrewdayOrganizationKey> = {
  "cd-coast-services-aisha-cole": "coast-services",
  "cd-coast-services-lucia-hr": "coast-services",
  "cd-coast-services-marco-ruiz": "coast-services",
  "cd-coast-services-sam-support": "coast-services",
  "cd-harbor-bites-aisha-cole": "harbor-bites",
  "cd-harbor-bites-derek-payroll": "harbor-bites",
  "cd-harbor-bites-jen-park": "harbor-bites",
  "cd-harbor-bites-lucia-hr": "harbor-bites",
  "cd-harbor-bites-marco-ruiz": "harbor-bites",
  "cd-harbor-bites-priya-sales": "harbor-bites",
  "cd-harbor-bites-sam-support": "harbor-bites",
  "cd-harbor-bites-tom-franchise": "harbor-bites",
  "cd-norte-retail-aisha-cole": "norte-retail",
  "cd-norte-retail-derek-payroll": "norte-retail",
  "cd-norte-retail-jen-park": "norte-retail",
  "cd-norte-retail-lucia-hr": "norte-retail",
  "cd-norte-retail-marco-ruiz": "norte-retail",
  "cd-norte-retail-priya-sales": "norte-retail",
  "cd-norte-retail-sam-support": "norte-retail",
  "cd-norte-retail-tom-franchise": "norte-retail",
  "cd-prairie-foods-aisha-cole": "prairie-foods",
  "cd-prairie-foods-derek-payroll": "prairie-foods",
  "cd-prairie-foods-jen-park": "prairie-foods",
  "cd-prairie-foods-lucia-hr": "prairie-foods",
  "cd-summit-hospitality-aisha-cole": "summit-hospitality",
  "cd-summit-hospitality-derek-payroll": "summit-hospitality",
  "cd-summit-hospitality-jen-park": "summit-hospitality",
  "cd-summit-hospitality-lucia-hr": "summit-hospitality",
  "cd-summit-hospitality-sam-support": "summit-hospitality",
  "cd-summit-hospitality-tom-franchise": "summit-hospitality",
  "cd-vida-cafe-jen-park": "vida-cafe",
  "cd-vida-cafe-marco-ruiz": "vida-cafe",
  "cd-vida-cafe-morgan-pm": "vida-cafe",
  "cd-vida-cafe-priya-sales": "vida-cafe",
  "cd-vida-cafe-sam-support": "vida-cafe",
  "cd-vida-cafe-yuki-student": "vida-cafe",
};

export const organizationForSupporterKey = (
  supporterKey: string
): CrewdayOrganizationKey | null => supporterOrgMap[supporterKey] ?? null;

export const CREWDAY_SYNTHETIC_PROVENANCE =
  "Authored Meta CTO assessment fixtures; not production telemetry or real customer accounts.";

/** Documented smoke / walkthrough anchor request IDs (stable across seed versions). */
export const CREWDAY_SMOKE_ANCHOR_IDS = {
  mergeVictimSwap: "00000000-0000-4000-8000-000000008202",
  openQueueSwapApproval: "00000000-0000-4000-8000-000000008203",
  payrollCanonical: "00000000-0000-4000-8000-000000008501",
  pendingConfirmPush: "00000000-0000-4000-8000-000000008907",
  regionalCoverageOpen: "00000000-0000-4000-8000-000000008801",
  sickCallCoverage: "00000000-0000-4000-8000-000000008101",
  spanishNotification: "00000000-0000-4000-8000-000000008403",
} as const;
