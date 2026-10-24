const SHARED_SUBJECT = "shared";

/** Trusted server configuration. Never derived from a caller-controlled host. */
export const rateLimitEnforced = ({ env }: { env: NodeJS.ProcessEnv }) => {
  if (env.GENUI_ENFORCE_RATE_LIMIT === "0") return false;
  if (env.GENUI_ENFORCE_RATE_LIMIT === "1") return true;
  return env.NODE_ENV === "production";
};

/**
 * Subject for unauthenticated demo quotas.
 * A forwarded IP header is used only when the deployment names the header its
 * ingress overwrites. Otherwise every caller shares one bucket so a spoofed
 * header cannot mint new quotas.
 */
export const rateLimitSubject = ({
  env,
  request,
}: {
  env: NodeJS.ProcessEnv;
  request: Request;
}) => {
  const headerName = env.RATE_LIMIT_TRUSTED_IP_HEADER?.trim();
  if (!headerName) return SHARED_SUBJECT;
  const candidate =
    request.headers.get(headerName)?.split(",")[0]?.trim() ?? "";
  if (!/^[\d.a-fA-F:]{1,64}$/u.test(candidate)) return SHARED_SUBJECT;
  return candidate;
};
