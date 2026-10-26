export const redactForLog = (text) =>
  text
    .replaceAll(/Bearer\s+\S+/giu, "Bearer [REDACTED]")
    .replaceAll(
      /\b[A-Z0-9_]*(?:API_KEY|SECRET|TOKEN|PASSWORD)[A-Z0-9_]*\s*=\s*\S+/giu,
      (m) => `${m.split("=")[0]}=[REDACTED]`
    );
