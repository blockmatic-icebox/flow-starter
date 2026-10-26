import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { retrieveLexicalCandidates } from "./retrieve-candidates";

const swapCanonical = {
  description:
    "Marco agreed to cover Saturday and our manager approved it yesterday, but both of us still see the old schedule.",
  id: "00000000-0000-4000-8000-000000008201",
  title: "My approved shift swap disappeared",
};

describe("retrieveLexicalCandidates", () => {
  it("ranks paraphrased shift-swap intake above unrelated requests", () => {
    const candidates = retrieveLexicalCandidates({
      description:
        "Manager signed off on our trade but the app still shows the original Saturday shift for both of us.",
      limit: 5,
      published: [
        swapCanonical,
        {
          description:
            "Need overtime rules applied before payroll export Friday.",
          id: "payroll-1",
          title: "Overtime not calculating on close shifts",
        },
      ],
      title: "Approved swap did not update either schedule",
    });

    assert.equal(candidates[0]?.id, swapCanonical.id);
    assert.ok((candidates[0]?.score ?? 0) > (candidates[1]?.score ?? 0));
  });

  it("does not surface swap requests as duplicates for payroll-only intake", () => {
    const candidates = retrieveLexicalCandidates({
      description:
        "Tips and overtime are wrong on the payroll export this week.",
      limit: 5,
      published: [
        swapCanonical,
        {
          description: "Payroll file missing meal break adjustments.",
          id: "payroll-2",
          title: "Payroll export missing break deductions",
        },
      ],
      title: "Payroll export missing tips",
    });

    const payrollHit = candidates.find((c) => c.id === "payroll-2");
    const swapHit = candidates.find((c) => c.id === swapCanonical.id);
    assert.equal(candidates[0]?.id, "payroll-2");
    assert.ok(payrollHit);
    if (swapHit)
      assert.ok(
        (payrollHit.score ?? 0) > (swapHit.score ?? 0),
        "payroll intake should outrank weak swap overlap"
      );
  });
});
