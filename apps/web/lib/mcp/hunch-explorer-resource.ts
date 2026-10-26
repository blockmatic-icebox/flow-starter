import { readFile } from "node:fs/promises";
import path from "node:path";

export const HUNCH_EXPLORER_RESOURCE_URI = "ui://hunch/explorer";

/** Shown in MCP resource metadata — Crewday demo context for agents. */
export const hunchExplorerResourceDescription =
  "Interactive Hunch Explorer for fictional Crewday workforce-scheduling feedback (signals, theme patterns, triage queue).";

export const hunchExplorerHtmlPath = () =>
  path.join(process.cwd(), "mcp-app/dist/hunch-explorer.html");

export const readHunchExplorerHtml = () =>
  readFile(hunchExplorerHtmlPath(), "utf-8");
