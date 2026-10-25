export const duplicateEventIdReason = ({
  events,
}: {
  events: { id: string }[];
}) => {
  const seenIds = new Set<string>();
  for (const event of events) {
    if (seenIds.has(event.id)) return "duplicate event id";
    seenIds.add(event.id);
  }
  return null;
};
