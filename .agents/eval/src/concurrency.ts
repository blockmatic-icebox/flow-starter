import os from "node:os";

export const evalConcurrency = () => {
  const fromEnv = Number(process.env.EVAL_CONCURRENCY);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return Math.floor(fromEnv);
  return Math.max(1, Math.min(2, os.availableParallelism()));
};

export const mapWithConcurrency = async <T, R>({
  concurrency,
  items,
  worker,
}: {
  concurrency: number;
  items: T[];
  worker: (item: T, index: number) => Promise<R>;
}) => {
  const results: R[] = Array.from({ length: items.length });
  let nextIndex = 0;
  const runWorker = async (): Promise<void> => {
    const index = nextIndex;
    nextIndex += 1;
    if (index >= items.length) return;
    const item = items[index];
    if (item === undefined) return;
    results[index] = await worker(item, index);
    await runWorker();
  };
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => runWorker()
  );
  await Promise.all(workers);
  return results;
};
