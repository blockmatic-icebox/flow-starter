"use client";

import { Button } from "@repo/ui/components/button";
import { useState } from "react";

export const CopyMcpUrl = ({ url }: { url: string }) => {
  const [copied, setCopied] = useState(false);

  return (
    <div className="not-prose flex flex-wrap items-center gap-2">
      <code className="border-border rounded border px-2 py-1 text-xs">
        {url}
      </code>
      <Button
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        size="sm"
        type="button"
        variant="outline"
      >
        {copied ? "Copied" : "Copy MCP URL"}
      </Button>
    </div>
  );
};
