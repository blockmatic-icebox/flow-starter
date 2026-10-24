const SHARED_SUBJECT = "shared";

/** Trusted server configuration. Never derived from a caller-controlled host. */
export const rateLimitEnforced = ({ env }: { env: NodeJS.ProcessEnv }) => {
  if (env.GENUI_ENFORCE_RATE_LIMIT === "0") return false;
  if (env.GENUI_ENFORCE_RATE_LIMIT === "1") return true;
  return env.NODE_ENV === "production";
};

export const rateLimitIdentity = ({
  env,
  request,
}: {
  env: NodeJS.ProcessEnv;
  request: Request;
}) => {
  const headerName = env.RATE_LIMIT_TRUSTED_IP_HEADER?.trim();
  if (!headerName) return { ok: false as const };
  const candidate =
    request.headers.get(headerName)?.split(",")[0]?.trim() ?? "";
  if (!/^[\d.a-fA-F:]{1,64}$/u.test(candidate)) return { ok: false as const };
  return { ok: true as const, subject: candidate };
};

/**
 * Subject for unauthenticated demo quotas.
 * A forwarded IP header is used only when the deployment names the header its
 * ingress overwrites. When rate limits are enforced, missing identity fails closed.
 */
export const rateLimitSubject = ({
  env,
  request,
}: {
  env: NodeJS.ProcessEnv;
  request: Request;
}) => {
  const identity = rateLimitIdentity({ env, request });
  if (identity.ok) return identity.subject;
  return SHARED_SUBJECT;
};
