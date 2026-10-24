import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { consultantFacts } from "./facts";
import {
  pickConsultantTool,
  runConsultantTool,
  wantsOpenGenuiDemo,
} from "./tools";

describe("consultant facts", () => {
  it("does not list eve or /dev workspace as shipped", () => {
    const shipped = consultantFacts.shipped.join(" ").toLowerCase();
    assert.equal(shipped.includes("eve"), false);
    assert.equal(shipped.includes("/dev workspace"), false);
    const planned = consultantFacts.planned.join(" ").toLowerCase();
    assert.match(planned, /eve/u);
    assert.match(planned, /\/dev/u);
  });
});

describe("consultant tools", () => {
  it("routes technology questions", () => {
    assert.equal(
      pickConsultantTool("What technologies does this use?"),
      "describe_technologies"
    );
  });

  it("returns architecture text from tool", () => {
    const text = runConsultantTool("describe_architecture");
    assert.match(text, /Flow Starter/u);
    assert.match(text, /Implemented today/u);
  });

  it("detects open genui demo intent", () => {
    assert.equal(wantsOpenGenuiDemo("haz click en el botón del demo"), true);
    assert.equal(wantsOpenGenuiDemo("how is this built"), false);
  });
});
