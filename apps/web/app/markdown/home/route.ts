import { fiHomeMarkdown } from "@/lib/fi-home-content";
import { markdownResponse } from "@/lib/markdown-negotiation";

export const dynamic = "force-dynamic";

export const GET = () => markdownResponse(fiHomeMarkdown);
