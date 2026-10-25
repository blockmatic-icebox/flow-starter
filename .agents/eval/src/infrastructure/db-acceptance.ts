import { verifySubjectDatabase } from "./database.ts";
import { readSubjectDatabaseUrl } from "./subject-env.ts";

const worktreePath = process.env.FLOW_EVAL_WORKTREE?.trim();
if (!worktreePath) {
  console.error("FLOW_EVAL_WORKTREE required");
  process.exit(2);
}

const url = readSubjectDatabaseUrl(worktreePath);
if (!url) {
  console.error("BLOCKED: subject DATABASE_URL missing");
  process.exit(2);
}

try {
  await verifySubjectDatabase({ worktreePath });
  console.log("Database acceptance OK");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
