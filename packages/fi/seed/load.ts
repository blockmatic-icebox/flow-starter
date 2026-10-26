import {
  createDb,
  featureRequest,
  featureRequestDuplicateCandidate,
  featureRequestSupport,
} from "@repo/db";
import { sql as drizzleSql } from "drizzle-orm";

import { loadRootEnv } from "../src/db/get-db";
import { assertSeedAllowed } from "./assert-seed-allowed";
import { generateSeed } from "./generate-seed";
import { isDestructiveSeedMode, isIfEmptySeedMode } from "./seed-mode";
import { labelForThemeKey } from "./theme-label";
import { validateGeneratedSeed } from "./validate-manifest";

loadRootEnv();

const ifEmpty = isIfEmptySeedMode();
if (isDestructiveSeedMode()) assertSeedAllowed();

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL is required to seed");
  process.exit(1);
}

const env = { ...process.env };
const localProxy =
  /\/\/(?:[^/@]+@)?(?:localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/u.test(url);
if (env.NODE_ENV !== "production" && localProxy)
  env.DATABASE_TLS_INSECURE_LOCAL ??= "1";

const { db, sql } = createDb({ env, url });

const seedSteps = {
  duration_ms: 0,
  model: "seed",
  steps: [{ detail: "Generated demo seed row", name: "seed" }],
  version: 1,
};

const chunk = 50;

const insertChunks = async <T>(
  items: T[],
  insert: (slice: T[]) => Promise<unknown>
) => {
  const tasks: Promise<unknown>[] = [];
  for (let i = 0; i < items.length; i += chunk) {
    tasks.push(insert(items.slice(i, i + chunk)));
  }
  await Promise.all(tasks);
};

if (ifEmpty) {
  const [countRow] = await db
    .select({ count: drizzleSql<number>`count(*)::int` })
    .from(featureRequest);
  const n = Number(countRow?.count ?? 0);
  if (n > 0) {
    console.log(
      `FI seed skipped (if-empty): feature_request already has ${n} rows`
    );
    await sql.end();
    process.exit(0);
  }
  console.log("FI seed if-empty: database empty, loading demo seed…");
}

const { duplicateCandidates, requests } = generateSeed();
const validation = validateGeneratedSeed({ duplicateCandidates, requests });
if (!validation.ok) {
  console.error("Seed manifest validation failed:");
  for (const e of validation.errors) console.error(`  - ${e}`);
  process.exit(1);
}

if (isDestructiveSeedMode()) {
  await sql`DELETE FROM feature_request_support`;
  await sql`DELETE FROM feature_request_duplicate_candidate`;
  await sql`DELETE FROM feature_request`;
}

await insertChunks(requests, (slice) =>
  db.insert(featureRequest).values(
    slice.map((row) => ({
      canonicalRequestId: row.canonicalRequestId ?? null,
      decisionBrief: row.decisionBrief ?? null,
      description: row.description,
      disposition: row.disposition ?? null,
      dispositionAt: row.dispositionAt ?? null,
      dispositionRationale: row.dispositionRationale ?? null,
      id: row.id,
      intakeLinkedRequestId: row.intakeLinkedRequestId ?? null,
      mergeTargetId: row.mergeTargetId ?? null,
      pmReviewStartedAt: row.pmReviewStartedAt ?? null,
      problemStatement: row.problemStatement,
      publishedAt: row.publishedAt ?? null,
      source: row.source,
      status: row.status,
      submittedAt: row.submittedAt,
      themeKey: row.themeKey,
      themeLabel: labelForThemeKey(row.themeKey),
      themeRationale: "Seed demo",
      title: row.title,
      triageCompletedAt: row.triageCompletedAt ?? null,
      triageSteps:
        row.status === "published" || row.status === "pending_confirm"
          ? seedSteps
          : null,
    }))
  )
);

await insertChunks(duplicateCandidates, (slice) =>
  db.insert(featureRequestDuplicateCandidate).values(
    slice.map((d) => ({
      candidateRequestId: d.candidateRequestId,
      explanation: d.explanation,
      requestId: d.requestId,
      score: d.score,
    }))
  )
);

const supportRows: { requestId: string; supporterKey: string }[] = [];
for (const row of requests) {
  const keys = row.supporterKeys ?? [];
  if (keys.length > 0) {
    for (const k of keys)
      supportRows.push({ requestId: row.id, supporterKey: k });
    continue;
  }
  for (let s = 0; s < row.supportCount; s += 1) {
    supportRows.push({
      requestId: row.id,
      supporterKey: `seed-${row.id.slice(-8)}-${s}`,
    });
  }
}

await insertChunks(supportRows, (slice) =>
  db.insert(featureRequestSupport).values(slice)
);

console.log(
  `Seeded ${requests.length} feature requests (${duplicateCandidates.length} duplicate candidates, ${supportRows.length} support rows)`
);
await sql.end();
