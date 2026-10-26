export const resolveSiteOrigin = (request?: Request) => {
  const fromEnv = process.env.NEXT_PUBLIC_APP_ORIGIN?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/u, "");

  if (request) {
    const host =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (host) {
      const proto = request.headers.get("x-forwarded-proto") ?? "https";
      return `${proto}://${host}`;
    }
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/u, "")}`;

  const agentic = process.env.AGENTIC_CHECK_URL?.trim();
  if (agentic) {
    const host = agentic.replace(/^https?:\/\//u, "").replace(/\/$/u, "");
    return `https://${host}`;
  }

  return "https://meta-cto-two.vercel.app";
};
