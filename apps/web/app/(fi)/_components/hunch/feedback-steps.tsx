const steps = [
  { id: 1, label: "Capture" },
  { id: 2, label: "Check" },
  { id: 3, label: "Publish" },
] as const;

const stepClassName = (stepId: number, current: number) => {
  if (stepId === current) return "text-foreground font-medium";
  if (stepId < current) return "text-muted-foreground";
  return "text-muted-foreground/60";
};

export const FeedbackSteps = ({ current }: { current: 1 | 2 | 3 }) => (
  <ol className="flex gap-2 text-xs">
    {steps.map((step) => (
      <li className={stepClassName(step.id, current)} key={step.id}>
        {step.id}. {step.label}
        {step.id < 3 ? (
          <span className="text-muted-foreground/40 mx-1">→</span>
        ) : null}
      </li>
    ))}
  </ol>
);

export const FeedbackNextSidebar = () => (
  <aside className="border-border bg-muted/30 rounded-md border p-4 text-sm">
    <h2 className="font-semibold">What happens next</h2>
    <ol className="text-muted-foreground mt-3 list-decimal space-y-2 pl-4">
      <li>Capture raw feedback and source.</li>
      <li>Check related signals before publishing.</li>
      <li>Review and publish to the signal catalog.</li>
    </ol>
  </aside>
);
