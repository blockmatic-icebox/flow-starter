import { FeedbackNextSidebar } from "../../_components/hunch/feedback-steps";
import { SubmitForm } from "../../requests/new/submit-form";

export default async function AddFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ context?: string }>;
}) {
  const params = await searchParams;
  const context = params.context === "internal" ? "internal" : "external";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">
          What are customers telling you?
        </h1>
        <p className="text-muted-foreground text-sm">
          {context === "external"
            ? "Capture customer feedback in plain language."
            : "Paste notes from calls or tickets — we check related signals first."}
        </p>
      </header>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <SubmitForm context={context} />
        <FeedbackNextSidebar />
      </div>
    </div>
  );
}
