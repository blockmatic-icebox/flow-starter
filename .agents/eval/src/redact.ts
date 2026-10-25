const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gu;
const bearerPattern = /Bearer\s+[A-Za-z0-9._~+/=-]+/giu;
const keyAssignPattern =
  /(?:[A-Z0-9_]*(?:API_KEY|SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE_KEY)[A-Z0-9_]*)\s*=\s*[^\s\n]+/giu;
const urlUserinfoPattern = /[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:[^@\s/]+@/giu;
const pemPattern =
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gu;
const jwtPattern =
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/gu;

const sensitiveEnvNames = [
  "AI_GATEWAY_API_KEY",
  "CURSOR_API_KEY",
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
];

const REDACTED = "[REDACTED]";
const REDACTED_EMAIL = "[REDACTED_EMAIL]";
const REDACTED_PEM = "[REDACTED_PEM]";
const REDACTED_JWT = "[REDACTED_JWT]";

export const redactText = ({ text }: { text: string }) => {
  let out = text
    .replaceAll(emailPattern, REDACTED_EMAIL)
    .replaceAll(bearerPattern, `Bearer ${REDACTED}`)
    .replaceAll(keyAssignPattern, (m) => `${m.split("=")[0]}=${REDACTED}`)
    .replaceAll(urlUserinfoPattern, (m) => {
      const proto = m.split("://")[0];
      return `${proto}://[REDACTED_USER]%40[REDACTED_HOST]`;
    })
    .replaceAll(pemPattern, REDACTED_PEM)
    .replaceAll(jwtPattern, REDACTED_JWT);

  for (const name of sensitiveEnvNames)
    out = out.replaceAll(name, `[REDACTED_${name}]`);

  return out;
};

const assertRedacted = ({ text }: { text: string }) => {
  if (emailPattern.test(text)) return { ok: false, reason: "email" };
  if (bearerPattern.test(text)) return { ok: false, reason: "bearer" };
  if (keyAssignPattern.test(text)) return { ok: false, reason: "key-assign" };
  if (pemPattern.test(text)) return { ok: false, reason: "pem" };
  if (jwtPattern.test(text)) return { ok: false, reason: "jwt" };
  return { ok: true as const };
};

export const redactOrThrow = ({ text }: { text: string }) => {
  const redacted = redactText({ text });
  const check = assertRedacted({ text: redacted });
  if (!check.ok) throw new Error(`redaction failed: ${check.reason}`);
  return redacted;
};
