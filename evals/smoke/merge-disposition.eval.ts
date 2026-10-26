import {
  confirmRequest,
  createDraftAndTriage,
  getDb,
  getRequest,
  loadRootEnv,
  setDisposition,
} from "@repo/fi";
import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";

export default defineEval({
  description:
    "setDisposition merge records mergeTargetId on an owned published pair.",
  tags: ["smoke"],
  async test(t) {
    loadRootEnv();
    const db = getDb();
    const suffix = crypto.randomUUID().slice(0, 8);
    const { request: canonicalDraft } = await createDraftAndTriage({
      db,
      description:
        "Manager approved Marco and Jen's Saturday swap but both schedules still show the original shift.",
      source: "internal",
      title: `Canonical Harbor Bites swap still wrong (${suffix})`,
    });
    const canonicalId = canonicalDraft?.id;
    if (!canonicalId) throw new Error("missing canonical draft id");
    await confirmRequest({ db, requestId: canonicalId });

    const { request: sourceDraft } = await createDraftAndTriage({
      db,
      description:
        "Guest ticket: approved swap in app but timeclock still had the old shift — same story as Marco.",
      source: "internal",
      title: `Duplicate swap complaint from support (${suffix})`,
    });
    const sourceId = sourceDraft?.id;
    if (!sourceId) throw new Error("missing source draft id");
    await confirmRequest({ db, requestId: sourceId });

    await setDisposition({
      db,
      disposition: "merge",
      dispositionRationale:
        "Same swap-sync failure; track on canonical Harbor Bites signal.",
      mergeTargetId: canonicalId,
      requestId: sourceId,
    });

    const detail = await getRequest({ db, requestId: sourceId });
    await t.require(detail?.request.disposition ?? "", equals("merge"));
    await t.check(detail?.request.mergeTargetId ?? "", equals(canonicalId));
    t.succeeded();
  },
});
