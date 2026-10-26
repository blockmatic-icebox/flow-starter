import { getDb, listTriageQueue } from "@repo/fi";

import { HunchAppFrame } from "./hunch-app-frame";

export const HunchShell = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  let openCount: number | null = null;
  try {
    const queue = await listTriageQueue({ db: getDb() });
    openCount = queue.length;
  } catch {
    // Preview builds without DATABASE_URL still render; do not show zero.
  }

  return <HunchAppFrame openCount={openCount}>{children}</HunchAppFrame>;
};
