import type { MetadataRoute } from "next";

import { resolveSiteOrigin } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = resolveSiteOrigin();
  const now = new Date();
  const routes = [
    "/",
    "/requests",
    "/requests/new",
    "/triage",
    "/insights",
    "/chat",
  ];
  return routes.map((path) => ({
    changeFrequency: "weekly",
    lastModified: now,
    priority: path === "/" ? 1 : 0.8,
    url: `${origin}${path}`,
  }));
}
