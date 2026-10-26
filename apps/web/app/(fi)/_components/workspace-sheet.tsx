import type { ReactNode } from "react";

export const WorkspaceSheet = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={`border-border bg-card min-h-[min(70dvh,48rem)] rounded-md border ${className}`}
  >
    {children}
  </div>
);
