export interface ComposeCapabilityContext {
  clock: Date;
  correlationId: string;
  subject: string;
}

export const composeContextFromRequest = ({
  correlationId,
  subject,
}: {
  correlationId: string;
  subject: string;
}): ComposeCapabilityContext => ({
  clock: new Date(),
  correlationId,
  subject,
});
