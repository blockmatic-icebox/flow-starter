import { readFile } from "node:fs/promises";
import path from "node:path";

export const HUNCH_EXPLORER_RESOURCE_URI = "ui://hunch/explorer";

export const hunchExplorerHtmlPath = () =>
  path.join(process.cwd(), "mcp-app/dist/hunch-explorer.html");

export const readHunchExplorerHtml = () =>
  readFile(hunchExplorerHtmlPath(), "utf-8");
