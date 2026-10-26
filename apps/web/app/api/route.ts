import { resolveSiteOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export const GET = (request: Request) => {
  const origin = resolveSiteOrigin(request);
  return Response.json({
    description: "Feature Intelligence HTTP APIs",
    documentation: `${origin}/developers`,
    links: {
      chat: `${origin}/api/chat`,
      mcp: `${origin}/api/mcp`,
      openapi: `${origin}/openapi.json`,
    },
    title: "Feature Intelligence API",
  });
};
