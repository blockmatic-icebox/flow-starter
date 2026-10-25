CREATE TYPE "public"."feature_request_source" AS ENUM('customer', 'prospect', 'support', 'internal');--> statement-breakpoint
CREATE TYPE "public"."feature_request_status" AS ENUM('draft', 'triaging', 'pending_confirm', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."feature_request_disposition" AS ENUM('merge', 'monitor', 'decline', 'needs_discussion');--> statement-breakpoint
CREATE TABLE "feature_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"source" "feature_request_source" NOT NULL,
	"status" "feature_request_status" DEFAULT 'draft' NOT NULL,
	"problem_statement" text,
	"theme_key" text,
	"theme_label" text,
	"theme_rationale" text,
	"decision_brief" text,
	"triage_confidence" real,
	"triage_steps" jsonb,
	"canonical_request_id" uuid,
	"disposition" "feature_request_disposition",
	"disposition_rationale" text,
	"merge_target_id" uuid,
	"intake_linked_request_id" uuid,
	"submitted_at" timestamp with time zone,
	"triage_completed_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"pm_review_started_at" timestamp with time zone,
	"disposition_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "feature_request_duplicate_candidate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"candidate_request_id" uuid NOT NULL,
	"score" real NOT NULL,
	"explanation" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_request_support" (
	"request_id" uuid NOT NULL,
	"supporter_key" text NOT NULL,
	CONSTRAINT "feature_request_support_request_id_supporter_key_pk" PRIMARY KEY("request_id","supporter_key")
);
--> statement-breakpoint
ALTER TABLE "feature_request_duplicate_candidate" ADD CONSTRAINT "feature_request_duplicate_candidate_request_id_feature_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."feature_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_request_duplicate_candidate" ADD CONSTRAINT "feature_request_duplicate_candidate_candidate_request_id_feature_request_id_fk" FOREIGN KEY ("candidate_request_id") REFERENCES "public"."feature_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_request_support" ADD CONSTRAINT "feature_request_support_request_id_feature_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."feature_request"("id") ON DELETE cascade ON UPDATE no action;
