const LOCAL_DEV_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "flow.localhost",
]);

export const requestHost = (request: Request) =>
  new URL(request.url).hostname.toLowerCase();

export const isLocalDevHost = (host: string) =>
  LOCAL_DEV_HOSTS.has(host.toLowerCase());

/** Off on local dev hosts unless `GENUI_ENFORCE_RATE_LIMIT=1`. */
export const composeRateLimitEnforced = ({ host }: { host: string }) => {
  if (process.env.GENUI_ENFORCE_RATE_LIMIT === "1") return true;
  if (process.env.GENUI_ENFORCE_RATE_LIMIT === "0") return false;
  return !isLocalDevHost(host);
};

export const readRequestIp = (request: Request) => {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  if (forwarded) return forwarded;
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
};
