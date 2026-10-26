import assert from "node:assert/strict";
import test from "node:test";

import { buildFiJsonLd } from "../lib/fi-json-ld";

test("buildFiJsonLd includes SoftwareApplication and Organization graph", () => {
  const doc = buildFiJsonLd({ origin: "https://meta-cto-two.vercel.app" });
  const graph = doc["@graph"] as { "@type": string }[];
  const types = new Set(graph.map((node) => node["@type"]));
  assert.ok(types.has("SoftwareApplication"));
  assert.ok(types.has("Organization"));

  const app = graph.find((n) => n["@type"] === "SoftwareApplication") as {
    name?: string;
    url?: string;
  };
  assert.equal(app.name, "Feature Intelligence");
  assert.equal(app.url, "https://meta-cto-two.vercel.app");

  const org = graph.find((n) => n["@type"] === "Organization") as {
    contactPoint?: { email?: string; telephone?: string };
    address?: { streetAddress?: string };
  };
  assert.ok(org.contactPoint?.email);
  assert.ok(org.contactPoint?.telephone);
  assert.ok(org.address?.streetAddress);
});
