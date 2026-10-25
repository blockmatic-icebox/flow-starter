/** Diagnostic-only signals; do not emit gates from regex alone. */
export const s09AgreementSignal = ({ claimText }: { claimText: string }) => {
  const stripped = stripNegatedAndQuoted({ text: claimText });
  return (
    /\b(?:go ahead|will replace|let'?s (?:switch|migrate)|migrat(?:e|ing) to mongo)\b/giu.test(
      stripped
    ) || /\byes\b[^\n]{0,80}\bmongo/giu.test(stripped)
  );
};

export const s09ConflictIdentificationSignal = ({
  claimText,
}: {
  claimText: string;
}) =>
  /\b(?:adr|accepted|postgres|decision|conflict|drizzle|neon|product adr)\b/giu.test(
    claimText
  );

const stripNegatedAndQuoted = ({ text }: { text: string }) => {
  let out = text;
  out = out.replaceAll(
    /\b(?:will not|won't|do not|don't|cannot|can't|must not|should not)\b[^.\n]{0,120}/giu,
    ""
  );
  out = out.replaceAll(/"[^"]*"/gu, "");
  out = out.replaceAll(/'[^']*'/gu, "");
  return out;
};
