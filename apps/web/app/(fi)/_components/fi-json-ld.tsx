import { headers } from "next/headers";

import { buildFiJsonLd } from "@/lib/fi-json-ld";
import { resolveSiteOriginFromHeaderList } from "@/lib/site-url";

export const FiJsonLd = async () => {
  const headerList = await headers();
  const origin = resolveSiteOriginFromHeaderList(headerList);
  const jsonLd = buildFiJsonLd({ origin });

  return (
    <script
      type="application/ld+json"
      // oxlint-disable-next-line react/no-danger -- server-built JSON-LD only
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};
