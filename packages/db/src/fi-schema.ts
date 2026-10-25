import {
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const featureRequestSourceEnum = pgEnum("feature_request_source", [
  "customer",
  "prospect",
  "support",
  "internal",
]);

export const featureRequestStatusEnum = pgEnum("feature_request_status", [
  "draft",
  "triaging",
  "pending_confirm",
  "published",
  "archived",
]);

export const featureRequestDispositionEnum = pgEnum(
  "feature_request_disposition",
  ["merge", "monitor", "decline", "needs_discussion"]
);

export const featureRequest = pgTable("feature_request", {
  canonicalRequestId: uuid("canonical_request_id"),
  decisionBrief: text("decision_brief"),
  description: text("description").notNull(),
  disposition: featureRequestDispositionEnum("disposition"),
  dispositionAt: timestamp("disposition_at", { withTimezone: true }),
  dispositionRationale: text("disposition_rationale"),
  id: uuid("id").defaultRandom().primaryKey(),
  intakeLinkedRequestId: uuid("intake_linked_request_id"),
  mergeTargetId: uuid("merge_target_id"),
  pmReviewStartedAt: timestamp("pm_review_started_at", { withTimezone: true }),
  problemStatement: text("problem_statement"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  source: featureRequestSourceEnum("source").notNull(),
  status: featureRequestStatusEnum("status").notNull().default("draft"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  themeKey: text("theme_key"),
  themeLabel: text("theme_label"),
  themeRationale: text("theme_rationale"),
  title: text("title").notNull(),
  triageCompletedAt: timestamp("triage_completed_at", { withTimezone: true }),
  triageConfidence: real("triage_confidence"),
  triageSteps: jsonb("triage_steps"),
});

export const featureRequestDuplicateCandidate = pgTable(
  "feature_request_duplicate_candidate",
  {
    candidateRequestId: uuid("candidate_request_id")
      .notNull()
      .references(() => featureRequest.id, { onDelete: "cascade" }),
    explanation: text("explanation").notNull(),
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => featureRequest.id, { onDelete: "cascade" }),
    score: real("score").notNull(),
  }
);

export const featureRequestSupport = pgTable(
  "feature_request_support",
  {
    requestId: uuid("request_id")
      .notNull()
      .references(() => featureRequest.id, { onDelete: "cascade" }),
    supporterKey: text("supporter_key").notNull(),
  },
  (t) => [primaryKey({ columns: [t.requestId, t.supporterKey] })]
);
