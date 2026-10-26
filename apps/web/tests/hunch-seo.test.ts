import assert from "node:assert/strict";
import test from "node:test";

import {
  fiHomeMarkdown,
  fiSeoProductName,
  fiSeoProductPhrase,
} from "../lib/hunch-content";

test("FI SEO constants include brand and product phrase", () => {
  assert.equal(fiSeoProductName, "Feature Intelligence");
  assert.equal(fiSeoProductPhrase, "feature request triage");
});

test("fiHomeMarkdown includes brand and feature request triage", () => {
  assert.match(fiHomeMarkdown, /Feature Intelligence/u);
  assert.match(fiHomeMarkdown, /feature request triage/u);
  assert.ok(fiHomeMarkdown.length >= 500);
});
