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
  const raw = request.headers.get(headerName)?.trim() ?? "";
  if (raw.includes(",")) return { ok: false as const };
  if (!/^[\d.a-fA-F:]{1,64}$/u.test(raw)) return { ok: false as const };
  return { ok: true as const, subject: raw };
};
