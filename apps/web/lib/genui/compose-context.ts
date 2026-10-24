export interface ComposeCapabilityContext {
  clock: Date;
  correlationId: string;
  ip: string;
}

export const composeContextFromRequest = ({
  correlationId,
  ip,
}: {
  correlationId: string;
  ip: string;
}): ComposeCapabilityContext => ({
  clock: new Date(),
  correlationId,
  ip,
});
