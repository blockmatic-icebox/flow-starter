import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { experimentalEvalCommands, formatEvalUsage } from "./cli-usage.ts";

describe("formatEvalUsage", () => {
  it("hides experimental commands by default", () => {
    const text = formatEvalUsage({ showExperimental: false });
    assert.match(text, /Supported:/u);
    assert.doesNotMatch(text, /Experimental — unmaintained/u);
    for (const cmd of experimentalEvalCommands)
      assert.doesNotMatch(text, new RegExp(`\\b${cmd}\\b`, "u"));
  });

  it("lists experimental commands when requested", () => {
    const text = formatEvalUsage({ showExperimental: true });
    assert.match(text, /experiment \| self-improve \| pilot-loop/u);
  });
});
