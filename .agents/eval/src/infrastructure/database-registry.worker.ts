import { registerSubjectDatabase } from "./database-registry.ts";

const command = process.argv[2];
const runId = process.argv[3];
const databaseName = process.argv[4];
const subjectKey = process.argv[5];
if (command !== "register" || !runId || !databaseName || !subjectKey) {
  console.error("usage: worker register <runId> <databaseName> <subjectKey>");
  process.exit(2);
}

await registerSubjectDatabase({ databaseName, runId, subjectKey });
