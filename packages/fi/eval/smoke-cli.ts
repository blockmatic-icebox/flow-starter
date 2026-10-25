import {
  getDb,
  getRequest,
  listTriageQueue,
  searchRequests,
} from "../src/index";

const [command] = process.argv.slice(2);

const run = async () => {
  const db = getDb();
  if (command === "queue") {
    const queue = await listTriageQueue({ db });
    console.log(JSON.stringify({ count: queue.length }));
    return;
  }
  if (command === "csv") {
    const rows = await searchRequests({
      db,
      limit: 10,
      query: "CSV export",
    });
    console.log(
      JSON.stringify({
        count: rows.length,
        titles: rows.map((r) => r.title),
      })
    );
    return;
  }
  if (command === "declined") {
    const detail = await getRequest({
      db,
      requestId: "00000000-0000-4000-8000-000000000008",
    });
    console.log(
      JSON.stringify({
        rationale: detail?.request.dispositionRationale ?? "",
      })
    );
    return;
  }
  throw new Error(`unknown smoke command: ${command}`);
};

try {
  await run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
