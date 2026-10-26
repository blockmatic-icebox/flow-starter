import {
  ConfirmRequestError,
  confirmRequest,
  getDb,
  loadRootEnv,
} from "@repo/fi";
import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";

export default defineEval({
  description:
    "confirm_request rejects fabricated ids via ConfirmRequestError (not_found).",
  tags: ["smoke"],
  async test(t) {
    loadRootEnv();
    if (!process.env.DATABASE_URL?.trim())
      t.skip("DATABASE_URL not set; confirm rejection requires DB");

    const db = getDb();
    const fabricatedId = crypto.randomUUID();
    let error: ConfirmRequestError | undefined;
    try {
      await confirmRequest({ db, requestId: fabricatedId });
    } catch (error_) {
      if (error_ instanceof ConfirmRequestError) error = error_;
      else throw error_;
    }
    await t.require(error?.name ?? "", equals("ConfirmRequestError"));
    await t.require(error?.code ?? "", equals("not_found"));
    t.succeeded();
  },
});
