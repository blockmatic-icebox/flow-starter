import assert from "node:assert/strict";
import { test } from "node:test";

import { fixtureTriage } from "./triage";
import type { FeatureRequest } from "./types";

const base = ({
  description,
  id,
  title,
}: {
  description: string;
  id: string;
  title: string;
}): FeatureRequest => ({
  createdAt: "2026-10-20T00:00:00.000Z",
  description,
  id,
  status: "submitted",
  supportCount: 2,
  theme: "uncategorized",
  title,
});

test("fixture triage finds related mobile request", () => {
  const request = base({
    description: "Need responsive layout and screenshot upload on phones.",
    id: "fr_new",
    title: "Better mobile submit flow",
  });
  const catalog = [
    request,
    base({
      description: "Improve small-screen form and screenshot upload.",
      id: "fr_seed_mobile",
      title: "Mobile-friendly request submission",
    }),
  ];

  const triage = fixtureTriage({ request, requests: catalog });
  assert.equal(triage.mode, "fixture");
  assert.ok(triage.relatedIds.includes("fr_seed_mobile"));
  assert.equal(triage.suggestedTheme, "experience");
});
