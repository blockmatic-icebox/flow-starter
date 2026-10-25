import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { scenarioTemplates } from "./catalog-data.ts";
import { generationCatalogHash } from "./catalog-hash.ts";
import { composeScenario, scenarioContentHash } from "./compose.ts";
import { stratifiedMethodologySample } from "./methodology-sample.ts";
import { createSeededRng } from "./rng.ts";
import { selectGeneratedScenarios } from "./select.ts";
import { validateGeneratedScenario, validateTemplate } from "./validate.ts";

describe("generation", () => {
  it("catalog has at least 24 templates across categories and domains", () => {
    assert.ok(scenarioTemplates.length >= 24);
    const categories = new Set(scenarioTemplates.map((t) => t.category));
    assert.ok(categories.size >= 12);
    const domains = new Set(scenarioTemplates.map((t) => t.domain));
    assert.ok(domains.size >= 12);
    for (const t of scenarioTemplates) {
      const v = validateTemplate({ template: t });
      assert.equal(v.ok, true, `${t.templateId}: ${v.errors.join("; ")}`);
    }
  });

  it("same seed produces same scenario hash", () => {
    const a = selectGeneratedScenarios({
      count: 1,
      profile: "full-product",
      rng: createSeededRng({ seed: "repeat-seed" }),
    });
    const b = selectGeneratedScenarios({
      count: 1,
      profile: "full-product",
      rng: createSeededRng({ seed: "repeat-seed" }),
    });
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);
    if (!a.ok || !b.ok) return;
    const aScenario = a.scenarios[0];
    const bScenario = b.scenarios[0];
    assert.ok(aScenario);
    assert.ok(bScenario);
    assert.equal(
      scenarioContentHash({ scenario: aScenario }),
      scenarioContentHash({ scenario: bScenario })
    );
  });

  it("different seeds produce variation across a fixed sample", () => {
    const ids = new Set<string>();
    for (const seed of ["seed-a", "seed-b", "seed-c", "seed-d", "seed-e"]) {
      const picked = selectGeneratedScenarios({
        count: 1,
        profile: "full-product",
        rng: createSeededRng({ seed }),
      });
      assert.equal(picked.ok, true);
      if (!picked.ok) continue;
      const scenario = picked.scenarios[0];
      assert.ok(scenario);
      ids.add(scenario.id);
    }
    assert.ok(ids.size >= 2);
  });

  it("three full-product picks can use distinct domains", () => {
    const picked = selectGeneratedScenarios({
      count: 3,
      profile: "full-product",
      rng: createSeededRng({ seed: "three-distinct-domains" }),
    });
    assert.equal(picked.ok, true);
    if (!picked.ok) return;
    const domains = new Set(picked.scenarios.map((s) => s.domain));
    assert.equal(domains.size, 3);
    assert.equal(new Set(picked.scenarios.map((s) => s.id)).size, 3);
  });

  it("stratified mixed sample avoids duplicate ids in one run", () => {
    const picked = selectGeneratedScenarios({
      count: 5,
      profile: "mixed",
      rng: createSeededRng({ seed: "mixed-five" }),
    });
    assert.equal(picked.ok, true);
    if (!picked.ok) return;
    const ids = picked.scenarios.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("generated scenarios pass validation and include private oracle fields", () => {
    const template = scenarioTemplates[0];
    assert.ok(template);
    const scenario = composeScenario({
      rng: createSeededRng({ seed: "compose" }),
      template,
    });
    const v = validateGeneratedScenario({ scenario });
    assert.equal(v.ok, true);
    assert.ok(scenario.oracle.acceptanceChecks.length > 0);
    assert.ok(scenario.oracle.holdoutNotes.length > 0);
  });

  it("methodology stratified sample picks known public ids", () => {
    const ids = stratifiedMethodologySample({
      count: 5,
      rng: createSeededRng({ seed: "methodology" }),
    });
    assert.equal(ids.length, 5);
    assert.equal(new Set(ids).size, 5);
  });

  it("catalog hash is stable", () => {
    const h1 = generationCatalogHash();
    const h2 = generationCatalogHash();
    assert.equal(h1, h2);
  });
});
