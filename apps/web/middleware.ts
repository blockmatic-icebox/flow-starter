import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { wantsMarkdown } from "@/lib/markdown-negotiation";

const knownPath = (pathname: string) => {
  if (pathname === "/" || pathname === "/favicon.ico") return true;
  const prefixes = [
    "/requests",
    "/triage",
    "/insights",
    "/chat",
    "/api",
    "/llms.txt",
    "/.well-known",
    "/sitemap.xml",
    "/markdown",
    "/eve",
  ];
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
};

const notFoundMarkdown = (pathname: string, origin: string) =>
  `# Not found

The path \`${pathname}\` is not part of Feature Intelligence.

- Agent instructions: ${origin}/llms.txt
- Sitemap: ${origin}/sitemap.xml
- Home: ${origin}/
`;

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const accept = request.headers.get("accept");

  if (pathname === "/" && wantsMarkdown(accept))
    return NextResponse.rewrite(new URL("/markdown/home", request.url));

  if (!knownPath(pathname) && wantsMarkdown(accept)) {
    const { origin } = request.nextUrl;
    return new NextResponse(notFoundMarkdown(pathname, origin), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        Vary: "Accept",
      },
      status: 404,
    });
  }

  const response = NextResponse.next();
  if (pathname === "/") response.headers.set("Vary", "Accept");
  return response;
};

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
