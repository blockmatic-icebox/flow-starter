import { FeatureNav } from "@/app/_components/feature-nav";

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 p-6">
      <FeatureNav />
      {children}
    </div>
  );
}
