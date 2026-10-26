import { redirect } from "next/navigation";

export default async function LegacyRequestDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/signals/${id}`);
}
