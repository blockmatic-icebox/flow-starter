import { notFound } from "next/navigation";

import { markdownResponse, wantsMarkdown } from "@/lib/markdown-negotiation";
import { resolveSiteOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const notFoundMarkdown = (pathname: string, origin: string) =>
  `# Not found

The path \`${pathname}\` is not part of Feature Intelligence.

- Agent instructions: ${origin}/llms.txt
- Sitemap: ${origin}/sitemap.xml
- Home: ${origin}/
`;

export const GET = async (
  request: Request,
  context: { params: Promise<{ slug: string[] }> }
) => {
  const { slug } = await context.params;
  const accept = request.headers.get("accept");
  if (!wantsMarkdown(accept)) notFound();

  const pathname = `/${slug.join("/")}`;
  const origin = resolveSiteOrigin(request);
  return markdownResponse(notFoundMarkdown(pathname, origin), 404);
};
