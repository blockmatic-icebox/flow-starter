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
      description: "Eval canonical target for merge disposition smoke.",
      source: "internal",
      title: `Eval merge target ${suffix}`,
    });
    const canonicalId = canonicalDraft?.id;
    if (!canonicalId) throw new Error("missing canonical draft id");
    await confirmRequest({ db, requestId: canonicalId });

    const { request: sourceDraft } = await createDraftAndTriage({
      db,
      description: "Eval source row for merge disposition smoke.",
      source: "internal",
      title: `Eval merge source ${suffix}`,
    });
    const sourceId = sourceDraft?.id;
    if (!sourceId) throw new Error("missing source draft id");
    await confirmRequest({ db, requestId: sourceId });

    await setDisposition({
      db,
      disposition: "merge",
      dispositionRationale: "Eval merge into canonical signal",
      mergeTargetId: canonicalId,
      requestId: sourceId,
    });

    const detail = await getRequest({ db, requestId: sourceId });
    await t.require(detail?.request.disposition ?? "", equals("merge"));
    await t.check(detail?.request.mergeTargetId ?? "", equals(canonicalId));
    t.succeeded();
  },
});
