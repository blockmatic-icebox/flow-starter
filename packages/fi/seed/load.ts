import { createDb, featureRequest, featureRequestSupport } from "@repo/db";

import type { ThemeKey } from "../src/theme/registry.js";
import { themeLabelForKey } from "../src/theme/registry.js";
import { seedRequests } from "./fixture.js";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required to seed");
  process.exit(1);
}

const { db, sql } = createDb({ url });

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
          supporterKey: `seed-supporter-${i % 3}`,
        })
      )
    );
  })
);

console.log(`Seeded ${seedRequests.length} feature requests`);
await sql.end();
