import { currentFlowSha } from "../git.ts";
import {
  cleanupSubjectDatabase,
  prepareSubjectDatabase,
} from "../infrastructure/database.ts";
import { prepareInstalledSubject } from "./prepare-installed-product.ts";
import { evaluateReadiness } from "./readiness.ts";

export const evaluateReadinessWithDatabase = async ({
  caseIds,
  runId,
}: {
  caseIds?: string[];
  runId: string;
}) => {
  const flowSha = currentFlowSha();
  const prepared = prepareInstalledSubject({
    arm: "flow",
    flowSha,
    prepareNonce: runId,
    repetition: 1,
    runId,
    scenarioId: "readiness",
    withFixture: false,
    withSetup: process.env.FLOW_EVAL_SKIP_PRODUCT_SETUP !== "1",
  });

  await prepareSubjectDatabase({
    identity: prepared.identity,
    runId,
    worktreePath: prepared.worktreePath,
  });

  try {
    return evaluateReadiness({
      caseIds: caseIds ?? [
        "db-starter-persist",
        "web-starter-unit",
        "web-starter-browser",
      ],
      runId,
      worktreePath: prepared.worktreePath,
    });
  } finally {
    if (prepared.identity.databaseName)
      await cleanupSubjectDatabase({
        databaseName: prepared.identity.databaseName,
        runId,
      });
  }
};
