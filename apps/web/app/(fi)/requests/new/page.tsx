import { SubmitForm } from "./submit-form";

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ context?: string }>;
}) {
  const params = await searchParams;
  const context = params.context === "internal" ? "internal" : "external";

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-semibold">
        {context === "external" ? "Share feedback" : "Log customer feedback"}
      </h1>
      <SubmitForm context={context} />
    </div>
  );
}
