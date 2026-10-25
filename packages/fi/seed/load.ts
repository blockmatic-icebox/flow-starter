import { createDb, featureRequest, featureRequestSupport } from "@repo/db";

import { loadRootEnv } from "../src/db/get-db";
import type { ThemeKey } from "../src/theme/registry";
import { themeLabelForKey } from "../src/theme/registry";
import { seedRequests } from "./fixture";

loadRootEnv();
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

const now = new Date("2026-10-25T12:00:00Z");

await sql`DELETE FROM feature_request_support`;
await sql`DELETE FROM feature_request_duplicate_candidate`;
await sql`DELETE FROM feature_request`;

await Promise.all(
  seedRequests.map(async (row) => {
    const themeKey = row.themeKey as ThemeKey;
    await db.insert(featureRequest).values({
      decisionBrief: "Seeded PM brief for assessment demo.",
      description: `${row.title} — seeded description for demo.`,
      disposition: row.disposition ?? null,
      dispositionAt: row.disposition ? now : null,
      dispositionRationale:
        "dispositionRationale" in row ? row.dispositionRationale : null,
      id: row.id,
      problemStatement: `Underlying need related to ${row.title}`,
      publishedAt: now,
      source: row.source,
      status: row.status,
      submittedAt: now,
      themeKey,
      themeLabel: themeLabelForKey(themeKey),
      themeRationale: "Seed fixture",
      title: row.title,
      triageCompletedAt: now,
      triageSteps: {
        duration_ms: 0,
        model: "seed",
        steps: [{ detail: "Fixture row", name: "seed" }],
        version: 1,
      },
    });

    await Promise.all(
      Array.from({ length: row.support }, (_, i) =>
        db.insert(featureRequestSupport).values({
          requestId: row.id,
          supporterKey: `seed-supporter-${row.id}-${i}`,
        })
      )
    );
  })
);

console.log(`Seeded ${seedRequests.length} feature requests`);
await sql.end();
