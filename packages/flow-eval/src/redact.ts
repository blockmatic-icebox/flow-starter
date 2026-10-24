const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gu;
const bearerPattern = /Bearer\s+[A-Za-z0-9._~+/=-]+/giu;
const keyAssignPattern =
  /(?:API_KEY|SECRET|TOKEN|PASSWORD|CURSOR_API_KEY)\s*=\s*[^\s\n]+/giu;

const sensitiveEnvNames = [
  "AI_GATEWAY_API_KEY",
  "CURSOR_API_KEY",
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
];

export const redactText = ({ text }: { text: string }) => {
  let out = text
    .replaceAll(emailPattern, "[REDACTED_EMAIL]")
    .replaceAll(bearerPattern, "Bearer [REDACTED]")
    .replaceAll(keyAssignPattern, (m) => `${m.split("=")[0]}=[REDACTED]`);

  for (const name of sensitiveEnvNames)
    out = out.replaceAll(name, `[REDACTED_${name}]`);

  return out;
};

export const assertRedacted = ({ text }: { text: string }) => {
  if (emailPattern.test(text)) return { ok: false, reason: "email" };
  if (bearerPattern.test(text)) return { ok: false, reason: "bearer" };
  if (keyAssignPattern.test(text)) return { ok: false, reason: "key-assign" };
  return { ok: true as const };
};

export const redactOrThrow = ({ text }: { text: string }) => {
  const redacted = redactText({ text });
  const check = assertRedacted({ text: redacted });
  if (!check.ok) throw new Error(`redaction failed: ${check.reason}`);
  return redacted;
};
