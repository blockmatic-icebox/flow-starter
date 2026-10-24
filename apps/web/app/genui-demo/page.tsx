import { Suspense } from "react";

import { GenuiDemoClient } from "./genui-demo-client";

export default function GenuiDemoPage() {
  return (
    <Suspense>
      <GenuiDemoClient />
    </Suspense>
  );
}
