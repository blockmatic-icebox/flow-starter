import { FiShell } from "./_components/fi-shell";

export const dynamic = "force-dynamic";

export default function FiLayout({ children }: { children: React.ReactNode }) {
  return <FiShell>{children}</FiShell>;
}
