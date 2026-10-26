import assert from "node:assert/strict";
import test from "node:test";

import { validateTaskReporting } from "./check-task-reporting.mjs";

test("validateTaskReporting is a no-op on factory checkout", () => {
  assert.deepEqual(validateTaskReporting(), []);
});

test("validateTaskReporting is a no-op on minimal fixtures", () => {
  assert.deepEqual(validateTaskReporting("/tmp/empty-fixture"), []);
});
