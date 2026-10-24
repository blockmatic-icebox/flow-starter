import { Suspense } from "react";

import { GenuiFlowClient } from "@/app/_components/genui-flow-client";

export default function Page() {
  return (
    <Suspense>
      <GenuiFlowClient />
    </Suspense>
  );
}
