import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  appendPromptLogOnStop,
  stashPromptOnSubmit,
} from "./append-on-stop.mjs";

const seedEnabledRepo = (dir) => {
  writeFileSync(
    join(dir, "AGENTS.md"),
    "## Local prompt log (enabled)\n",
    "utf-8"
  );
  mkdirSync(join(dir, ".agents/flow/local"), { recursive: true });
  writeFileSync(
    join(dir, ".agents/flow/local/prompt-log.json"),
    JSON.stringify({ stage: "Build", work: "demo" }),
    "utf-8"
  );
};

test("stashPromptOnSubmit records human text for generation", () => {
  const dir = mkdtempSync(join(tmpdir(), "flow-prompt-stop-"));
  seedEnabledRepo(dir);

  stashPromptOnSubmit({
    hookInput: {
      generation_id: "gen-1",
      prompt: "<user_query>hello world</user_query>",
    },
    now: () => new Date("2026-10-25T18:00:00.000Z"),
    root: dir,
  });

  const pending = JSON.parse(
    readFileSync(
      join(dir, ".agents/flow/local/prompt-log-hook.pending.json"),
      "utf-8"
    )
  );
  assert.equal(pending.generationId, "gen-1");
  assert.equal(pending.human, "hello world");

  rmSync(dir, { force: true, recursive: true });
});

test("appendPromptLogOnStop appends one block and dedupes generation", () => {
  const dir = mkdtempSync(join(tmpdir(), "flow-prompt-stop-"));
  seedEnabledRepo(dir);

  const transcript = join(dir, "transcript.jsonl");
  writeFileSync(
    transcript,
    [
      JSON.stringify({
        message: {
          content: [{ text: "<user_query>Ship it</user_query>", type: "text" }],
        },
        role: "user",
      }),
      JSON.stringify({
        message: {
          content: [
            { text: "**Task report** — Done\n\nOutcome line.", type: "text" },
          ],
        },
        role: "assistant",
      }),
    ].join("\n"),
    "utf-8"
  );

  const hookInput = {
    generation_id: "gen-2",
    transcript_path: transcript,
  };

  const first = appendPromptLogOnStop({
    hookInput,
    now: () => new Date("2026-10-25T18:01:00.000Z"),
    root: dir,
  });
  assert.equal(first.appended, true);
  assert.ok(existsSync(join(dir, "prompts.txt")));

  const log = readFileSync(join(dir, "prompts.txt"), "utf-8");
  assert.match(log, /Human: Ship it/u);
  assert.match(log, /Generation: gen-2/u);

  const second = appendPromptLogOnStop({ hookInput, root: dir });
  assert.equal(second.skipped, "duplicate-generation");

  rmSync(dir, { force: true, recursive: true });
});
