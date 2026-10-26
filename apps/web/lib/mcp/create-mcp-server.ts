import {
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/server";

import {
  HUNCH_EXPLORER_RESOURCE_URI,
  hunchExplorerResourceDescription,
  readHunchExplorerHtml,
} from "./hunch-explorer-resource";
import { registerFiMcpTools } from "./register-tools";

export const createFiMcpServer = () => {
  const server = new McpServer({
    name: "feature-intelligence",
    version: "1.0.0",
  });

  registerAppResource(
    server,
    "Hunch Explorer",
    HUNCH_EXPLORER_RESOURCE_URI,
    {
      description: hunchExplorerResourceDescription,
    },
    async () => ({
      contents: [
        {
          mimeType: RESOURCE_MIME_TYPE,
          text: await readHunchExplorerHtml(),
          uri: HUNCH_EXPLORER_RESOURCE_URI,
        },
      ],
    })
  );

  registerFiMcpTools(server);
  return server;
};
