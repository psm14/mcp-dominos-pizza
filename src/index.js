#!/usr/bin/env node

/**
 * MCP Domino's Pizza Server
 *
 * A Model Context Protocol server for interacting with the Domino's Pizza API
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerActions } from "./actions/index.js";
import { createSessionManager } from "./utils/sessionManager.js";

async function main() {
  // Initialize the session manager for tracking state
  const sessionManager = createSessionManager();

  // Initialize the MCP server
  const server = new McpServer({
    name: "Domino's Pizza MCP",
    version: "1.0.0",
  });

  // Register all the tools with the server
  await registerActions(server, sessionManager);

  // Start the MCP server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
